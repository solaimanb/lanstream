import type { Result } from "@/lib/result";
import { err, ok } from "@/lib/result";
import { OFFLINE_THRESHOLD_MS } from "@/lib/constants";
import { db } from "@/server/db/client";
import { hostAgent, server } from "@/server/db/schema";
import { hashToken } from "@/server/security/tokens";
import { and, asc, eq, max } from "drizzle-orm";
import "server-only";

export interface HostAgentDTO {
  id: string;
  name: string;
  hostname: string | null;
  platform: string | null;
  version: string | null;
  localIp: string | null;
  online: boolean;
  lastSeenAt: Date | null;
  createdAt: Date;
}

function toDTO(row: typeof hostAgent.$inferSelect): HostAgentDTO {
  return {
    id: row.id,
    name: row.name,
    hostname: row.hostname,
    platform: row.platform,
    version: row.version,
    localIp: row.localIp,
    online:
      !!row.lastSeenAt &&
      Date.now() - row.lastSeenAt.getTime() <= OFFLINE_THRESHOLD_MS,
    lastSeenAt: row.lastSeenAt,
    createdAt: row.createdAt,
  };
}

export async function listHostAgentsByOwner(
  ownerId: string,
): Promise<HostAgentDTO[]> {
  const rows = await db
    .select()
    .from(hostAgent)
    .where(eq(hostAgent.ownerId, ownerId))
    .orderBy(asc(hostAgent.name));
  return rows.map(toDTO);
}

export async function getOwnedHostAgent(
  id: string,
  ownerId: string,
): Promise<Result<HostAgentDTO, "not_found">> {
  const rows = await db
    .select()
    .from(hostAgent)
    .where(and(eq(hostAgent.id, id), eq(hostAgent.ownerId, ownerId)))
    .limit(1);
  return rows[0] ? ok(toDTO(rows[0])) : err("not_found");
}

export async function authenticateHostAgent(token: string) {
  const rows = await db
    .select()
    .from(hostAgent)
    .where(eq(hostAgent.tokenHash, hashToken(token)))
    .limit(1);
  return rows[0] ?? null;
}

export async function touchHostAgent(
  id: string,
  info: {
    hostname: string;
    platform: string;
    version: string;
    localIp: string;
  },
): Promise<void> {
  await db
    .update(hostAgent)
    .set({ ...info, lastSeenAt: new Date(), updatedAt: new Date() })
    .where(eq(hostAgent.id, id));
}

export async function allocateHostPort(hostAgentId: string): Promise<number> {
  const rows = await db
    .select({ port: max(server.preferredPort) })
    .from(server)
    .where(eq(server.hostAgentId, hostAgentId));
  return Math.max(4780, (rows[0]?.port ?? 4779) + 1);
}

export async function deleteOwnedHostAgent(
  id: string,
  ownerId: string,
): Promise<Result<void, "not_found">> {
  const owned = await getOwnedHostAgent(id, ownerId);
  if (!owned.ok) return err("not_found");
  await db
    .update(server)
    .set({ status: "offline", hostAgentId: null, preferredPort: null })
    .where(eq(server.hostAgentId, id));
  const deleted = await db
    .delete(hostAgent)
    .where(and(eq(hostAgent.id, id), eq(hostAgent.ownerId, ownerId)))
    .returning({ id: hostAgent.id });
  return deleted.length ? ok(undefined) : err("not_found");
}
