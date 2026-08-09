"use server";

import type { Result } from "@/lib/result";
import { err, ok } from "@/lib/result";
import { getServerSession } from "@/server/auth/session";
import { approveAgentPairing } from "@/server/dal/agent-pairings";
import { createAuditEvent } from "@/server/dal/audit-events";
import { deleteOwnedHostAgent } from "@/server/dal/host-agents";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function approveHostAgentAction(
  userCode: string,
): Promise<
  Result<{ requestedName: string }, "unauthorized" | "invalid" | "expired">
> {
  const session = await getServerSession();
  if (!session?.user) return err("unauthorized");
  const parsed = z
    .string()
    .trim()
    .regex(/^\d{4}-\d{4}$/)
    .safeParse(userCode);
  if (!parsed.success) return err("invalid");
  const result = await approveAgentPairing(parsed.data, session.user.id);
  if (!result.ok) return result;
  await createAuditEvent({
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
  await createAuditEvent({
    userId: session.user.id,
    action: "host_agent.revoked",
    targetType: "host_agent",
    targetId: parsed.data,
  });
  revalidatePath("/hosts");
  revalidatePath("/(portal)/servers", "layout");
  return ok(undefined);
}
