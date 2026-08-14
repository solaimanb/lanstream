/**
 * Server Actions — server management.
 *
 * Handles creation, update, and deletion of servers
 * from the portal UI. Must verify session + ownership.
 */
"use server";

import type { Result } from "@/lib/result";
import { err, ok } from "@/lib/result";
import { logger } from "@/lib/logger";
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

/** Safe non-blocking audit event creation wrapper */
async function safeAuditEvent(params: Parameters<typeof createAuditEvent>[0]) {
  try {
    await createAuditEvent(params);
  } catch (err) {
    logger.error("AUDIT", "Failed to write audit event", err);
  }
}

/** List servers owned by the current user. */
export async function listMyServers(): Promise<
  Result<ServerDTO[], "unauthorized">
> {
  const session = await getServerSession();
  if (!session?.user) return err("unauthorized");
  const servers = await listServersByOwner(session.user.id);
  return ok(servers);
}

/** Create a new server. */
export async function createServerAction(
  input: unknown,
): Promise<
  Result<ServerDTO, "validation_error" | "unauthorized" | "host_not_found">
> {
  const session = await getServerSession();
  if (!session?.user) {
    logger.warn("ACTION", "Unauthenticated attempt to create server");
    return err("unauthorized");
  }

  const parsed = createServerSchema.safeParse(input);
  if (!parsed.success) {
    logger.warn("ACTION", "Validation failed on createServerAction", { issues: parsed.error.issues });
    return err("validation_error");
  }

  let preferredPort: number | undefined;
  if (parsed.data.hostAgentId) {
    const host = await getOwnedHostAgent(
      parsed.data.hostAgentId,
      session.user.id,
    );
    if (!host.ok) {
      logger.warn("ACTION", `Host agent ID ${parsed.data.hostAgentId} not found or not owned`);
      return err("host_not_found");
    }
    preferredPort = await allocateHostPort(parsed.data.hostAgentId);
  }

  const server = await createServer({
    name: parsed.data.name,
    ownerId: session.user.id,
    mediaPath: parsed.data.mediaPath,
    hostAgentId: parsed.data.hostAgentId,
    preferredPort,
  });

  logger.info("ACTION", `Created server "${server.name}" (ID: ${server.id})`, { userId: session.user.id });

  await safeAuditEvent({
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

  logger.info("ACTION", `Updated server ID ${serverId}`, { userId: session.user.id });

  await safeAuditEvent({
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

  logger.info("ACTION", `Deleted server ID ${serverId}`, { userId: session.user.id });

  await safeAuditEvent({
    userId: session.user.id,
    action: "server.deleted",
    targetType: "server",
    targetId: serverId,
  });

  revalidatePath("/(portal)/servers", "layout");
  return { ok: true, data: undefined };
}
