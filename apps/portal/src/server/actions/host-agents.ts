"use server";

import type { Result } from "@/lib/result";
import { err, ok } from "@/lib/result";
import { logger } from "@/lib/logger";
import { getServerSession } from "@/server/auth/session";
import { approveAgentPairing } from "@/server/dal/agent-pairings";
import { createAuditEvent } from "@/server/dal/audit-events";
import {
  deleteOwnedHostAgent,
  listHostAgentsByOwner,
} from "@/server/dal/host-agents";
import type { HostAgentDTO } from "@/server/dal/host-agents";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/** Safe non-blocking audit event creation wrapper */
async function safeAuditEvent(params: Parameters<typeof createAuditEvent>[0]) {
  try {
    await createAuditEvent(params);
  } catch (err) {
    logger.error("AUDIT", "Failed to write audit event", err);
  }
}

/** List host agents owned by the current user. */
export async function listMyHostAgents(): Promise<
  Result<HostAgentDTO[], "unauthorized">
> {
  const session = await getServerSession();
  if (!session?.user) return err("unauthorized");
  const agents = await listHostAgentsByOwner(session.user.id);
  return ok(agents);
}

export async function approveHostAgentAction(
  userCode: string,
): Promise<
  Result<{ requestedName: string }, "unauthorized" | "invalid" | "expired">
> {
  const session = await getServerSession();
  if (!session?.user) {
    logger.warn("ACTION", "Unauthenticated attempt to approve host agent");
    return err("unauthorized");
  }
  const parsed = z
    .string()
    .trim()
    .regex(/^\d{4}-\d{4}$/)
    .safeParse(userCode);
  if (!parsed.success) {
    logger.warn("ACTION", "Invalid pairing code format submitted", { userCode });
    return err("invalid");
  }
  const result = await approveAgentPairing(parsed.data, session.user.id);
  if (!result.ok) {
    logger.warn("ACTION", `Pairing approval failed: ${result.error}`, { userCode: parsed.data });
    return result;
  }
  logger.info("ACTION", `Approved host agent pairing "${result.data.requestedName}"`, {
    userId: session.user.id,
  });
  await safeAuditEvent({
    userId: session.user.id,
    action: "host_agent.approved",
    targetType: "agent_pairing",
    metadata: { name: result.data.requestedName },
  });
  return result;
}

export async function revokeHostAgentAction(
  hostAgentId: string,
): Promise<Result<void, "unauthorized" | "not_found">> {
  const session = await getServerSession();
  if (!session?.user) return err("unauthorized");
  const parsed = z.uuid().safeParse(hostAgentId);
  if (!parsed.success) return err("not_found");
  const result = await deleteOwnedHostAgent(parsed.data, session.user.id);
  if (!result.ok) return result;
  logger.info("ACTION", `Revoked host agent ID ${parsed.data}`, { userId: session.user.id });
  await safeAuditEvent({
    userId: session.user.id,
    action: "host_agent.revoked",
    targetType: "host_agent",
    targetId: parsed.data,
  });
  revalidatePath("/hosts");
  revalidatePath("/(portal)/servers", "layout");
  return ok(undefined);
}
