import { HEARTBEAT_INTERVAL_MS } from "@/lib/constants";
import type { Result } from "@/lib/result";
import { err, ok } from "@/lib/result";
import { listActiveAccessTokenHashes } from "@/server/dal/access-links";
import {
  authenticateHostAgent,
  touchHostAgent,
} from "@/server/dal/host-agents";
import { upsertHostDevice } from "@/server/dal/host-devices";
import { listServersByHostAgentId, updateServer } from "@/server/dal/servers";
import { agentHeartbeatSchema } from "@/server/validation/runtime";
import type { AgentHeartbeatResponse } from "@lanstream/protocol";
import "server-only";

export async function handleAgentHeartbeat(
  input: unknown,
  token: string | null,
): Promise<
  Result<AgentHeartbeatResponse, "validation_error" | "unauthorized">
> {
  const parsed = agentHeartbeatSchema.safeParse(input);
  if (!parsed.success) return err("validation_error");
  if (!token) return err("unauthorized");

  const agent = await authenticateHostAgent(token);
  if (!agent) return err("unauthorized");
  await touchHostAgent(agent.id, parsed.data.hostDeviceInfo);

  const assigned = await listServersByHostAgentId(agent.id);
  const assignedIds = new Set(assigned.map((item) => item.id));
  for (const report of parsed.data.servers) {
    if (!assignedIds.has(report.serverId)) continue;
    await updateServer(report.serverId, { status: report.status });
    await upsertHostDevice({
      serverId: report.serverId,
      info: { ...parsed.data.hostDeviceInfo, port: report.port },
    });
  }

  const assignments = await Promise.all(
    assigned.map(async (item) => ({
      serverId: item.id,
      name: item.name,
      mediaPath: item.mediaPath,
      port: item.preferredPort ?? 4780,
      desiredState: item.desiredState,
      accessTokenHashes: await listActiveAccessTokenHashes(item.id),
    })),
  );

  return ok({
    acknowledged: true,
    nextIntervalMs: Math.min(HEARTBEAT_INTERVAL_MS, 10_000),
    assignments,
  });
}
