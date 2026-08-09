/**
 * Server Actions — server management.
 *
 * Handles creation, update, and deletion of servers
 * from the portal UI. Must verify session + ownership.
 */
"use server";

import type { Result } from "@/lib/result";
import { err } from "@/lib/result";
import { getServerSession } from "@/server/auth/session";
import { createAuditEvent } from "@/server/dal/audit-events";
import { ensureServerOwnership } from "@/server/security/ownership";
import {
  createServer,
  deleteServer,
  listServersByOwner,
  updateServer,
} from "@/server/dal/servers";
import {
  createServerSchema,
  updateServerSchema,
} from "@/server/validation/servers";
import type { ServerDTO } from "@/types";
import { allocateHostPort, getOwnedHostAgent } from "@/server/dal/host-agents";
import { revalidatePath } from "next/cache";

/* ------------------------------------------------------------------ */
/*  Actions                                                            */
/* ------------------------------------------------------------------ */

/** List servers owned by the current user. */
export async function listMyServers(): Promise<ServerDTO[]> {
  const session = await getServerSession();
  if (!session?.user) throw new Error("Unauthorized");
  return listServersByOwner(session.user.id);
}

/** Create a new server. */
export async function createServerAction(
  input: unknown,
): Promise<
  Result<ServerDTO, "validation_error" | "unauthorized" | "host_not_found">
> {
  const session = await getServerSession();
  if (!session?.user) return err("unauthorized");

  const parsed = createServerSchema.safeParse(input);
  if (!parsed.success) return err("validation_error");

  let preferredPort: number | undefined;
  if (parsed.data.hostAgentId) {
    const host = await getOwnedHostAgent(
      parsed.data.hostAgentId,
      session.user.id,
    );
    if (!host.ok) return err("host_not_found");
    preferredPort = await allocateHostPort(parsed.data.hostAgentId);
  }

  const server = await createServer({
    name: parsed.data.name,
    ownerId: session.user.id,
    mediaPath: parsed.data.mediaPath,
    hostAgentId: parsed.data.hostAgentId,
    preferredPort,
  });

  await createAuditEvent({
    userId: session.user.id,
    action: "server.created",
    targetType: "server",
    targetId: server.id,
    metadata: { name: server.name },
  });

  revalidatePath("/(portal)/servers", "layout");
  return { ok: true, data: server };
}

/** Update an existing server (owner only). */
export async function updateServerAction(
  serverId: string,
  input: unknown,
): Promise<
  Result<
    ServerDTO,
    "validation_error" | "unauthorized" | "not_found" | "forbidden"
  >
> {
  const session = await getServerSession();
  if (!session?.user) return err("unauthorized");

  const parsed = updateServerSchema.safeParse(input);
  if (!parsed.success) return err("validation_error");

  const ownership = await ensureServerOwnership(serverId, session.user.id);
  if (!ownership.ok) return err(ownership.error);

  const result = await updateServer(serverId, parsed.data);
  if (!result.ok) return err(result.error);

  await createAuditEvent({
    userId: session.user.id,
    action: "server.updated",
    targetType: "server",
    targetId: serverId,
    metadata: parsed.data,
  });

  revalidatePath(`/(portal)/servers/${serverId}`);
  return result;
}

/** Delete a server (owner only). */
export async function deleteServerAction(
  serverId: string,
): Promise<Result<void, "unauthorized" | "not_found" | "forbidden">> {
  const session = await getServerSession();
  if (!session?.user) return err("unauthorized");

  const ownership = await ensureServerOwnership(serverId, session.user.id);
  if (!ownership.ok) return err(ownership.error);

  const result = await deleteServer(serverId);
  if (!result.ok) return err(result.error);

  await createAuditEvent({
    userId: session.user.id,
    action: "server.deleted",
    targetType: "server",
    targetId: serverId,
  });

  revalidatePath("/(portal)/servers", "layout");
  return { ok: true, data: undefined };
}
