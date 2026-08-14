/**
 * Server Actions — access link management.
 *
 * Handles creation and revocation of access links
 * from the portal UI. Verifies ownership before mutation.
 */
"use server";

import type { Result } from "@/lib/result";
import { err } from "@/lib/result";
import { logger } from "@/lib/logger";
import { getServerSession } from "@/server/auth/session";
import type {
  AccessLinkDTO,
  CreatedAccessLinkDTO,
} from "@/server/dal/access-links";
import {
  createAccessLink,
  listAccessLinksByServerId,
  revokeAccessLink,
} from "@/server/dal/access-links";
import { getHostDeviceByServerId } from "@/server/dal/host-devices";
import { getOwnedHostAgent } from "@/server/dal/host-agents";
import { createAuditEvent } from "@/server/dal/audit-events";
import { ensureServerOwnership } from "@/server/security/ownership";
import { db } from "@/server/db/client";
import { server } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import {
  createAccessLinkSchema,
  revokeAccessLinkSchema,
} from "@/server/validation/access-links";
import { revalidatePath } from "next/cache";

/** Safe non-blocking audit event creation wrapper */
async function safeAuditEvent(params: Parameters<typeof createAuditEvent>[0]) {
  try {
    await createAuditEvent(params);
  } catch (err) {
    logger.error("AUDIT", "Failed to write audit event", err);
  }
}

/* ------------------------------------------------------------------ */
/*  Actions                                                            */
/* ------------------------------------------------------------------ */

/** List access links for a server. */
export async function listAccessLinks(
  serverId: string,
): Promise<
  Result<AccessLinkDTO[], "unauthorized" | "not_found" | "forbidden">
> {
  const session = await getServerSession();
  if (!session?.user) return err("unauthorized");

  const ownership = await ensureServerOwnership(serverId, session.user.id);
  if (!ownership.ok) return err(ownership.error);

  const links = await listAccessLinksByServerId(serverId);
  return { ok: true, data: links };
}

/** Create a new access link. */
export async function createAccessLinkAction(
  input: unknown,
): Promise<
  Result<
    CreatedAccessLinkDTO & { guestUrl: string | null },
    "validation_error" | "unauthorized" | "not_found" | "forbidden"
  >
> {
  const session = await getServerSession();
  if (!session?.user) return err("unauthorized");

  const parsed = createAccessLinkSchema.safeParse(input);
  if (!parsed.success) return err("validation_error");

  const ownership = await ensureServerOwnership(
    parsed.data.serverId,
    session.user.id,
  );
  if (!ownership.ok) return err(ownership.error);

  const link = await createAccessLink({
    serverId: parsed.data.serverId,
    description: parsed.data.description,
    expiresAt: parsed.data.expiresAt,
    purpose: parsed.data.purpose,
  });
  const host = await getHostDeviceByServerId(parsed.data.serverId);
  let hostAddress: string | null = null;
  let port: number | null = null;

  if (host) {
    hostAddress = host.localIp.includes(":")
      ? `[${host.localIp}]`
      : host.localIp;
    port = host.port;
  } else {
    // Host hasn't sent a heartbeat yet — fall back to agent + server records
    const serverRow = await db
      .select({ hostAgentId: server.hostAgentId, port: server.preferredPort })
      .from(server)
      .where(eq(server.id, parsed.data.serverId))
      .limit(1);
    if (serverRow[0]?.hostAgentId) {
      const agent = await getOwnedHostAgent(
        serverRow[0].hostAgentId,
        session.user.id,
      );
      if (agent.ok && agent.data.localIp) {
        hostAddress = agent.data.localIp.includes(":")
          ? `[${agent.data.localIp}]`
          : agent.data.localIp;
        port = serverRow[0].port;
      }
    }
  }

  const guestUrl =
    hostAddress && port && parsed.data.purpose === "guest"
      ? `http://${hostAddress}:${port}/watch#${new URLSearchParams({ token: link.token })}`
      : null;

  logger.info("ACTION", `Created access link ID ${link.id} for server ${parsed.data.serverId}`, {
    userId: session.user.id,
  });

  await safeAuditEvent({
    userId: session.user.id,
    action: "access_link.created",
    targetType: "access_link",
    targetId: link.id,
    metadata: { serverId: parsed.data.serverId },
  });

  revalidatePath(`/(portal)/servers/${parsed.data.serverId}/access`);
  return { ok: true, data: { ...link, guestUrl } };
}

/** Revoke an access link. */
export async function revokeAccessLinkAction(
  input: unknown,
): Promise<
  Result<void, "validation_error" | "unauthorized" | "not_found" | "forbidden">
> {
  const session = await getServerSession();
  if (!session?.user) return err("unauthorized");

  const parsed = revokeAccessLinkSchema.safeParse(input);
  if (!parsed.success) return err("validation_error");

  const ownership = await ensureServerOwnership(
    parsed.data.serverId,
    session.user.id,
  );
  if (!ownership.ok) return err(ownership.error);

  const result = await revokeAccessLink(
    parsed.data.linkId,
    parsed.data.serverId,
  );
  if (!result.ok) return err(result.error);

  logger.info("ACTION", `Revoked access link ID ${parsed.data.linkId}`, { userId: session.user.id });

  await safeAuditEvent({
    userId: session.user.id,
    action: "access_link.revoked",
    targetType: "access_link",
    targetId: parsed.data.linkId,
    metadata: { serverId: parsed.data.serverId },
  });

  revalidatePath(`/(portal)/servers/${parsed.data.serverId}/access`);
  return { ok: true, data: undefined };
}
