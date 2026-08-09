/**
 * Data Access Layer — servers.
 *
 * All server queries go through this module. Handles ownership
 * verification, DTO shaping, and authorization checks.
 */
import type { Result } from "@/lib/result";
import { err, ok } from "@/lib/result";
import { OFFLINE_THRESHOLD_MS } from "@/lib/constants";
import { db } from "@/server/db/client";
import { hostDevice, server } from "@/server/db/schema";
import type { ServerDTO } from "@/types";
import { desc, eq } from "drizzle-orm";
import "server-only";
import { nanoid } from "./utils";

/* ------------------------------------------------------------------ */
/*  DTO shape helpers                                                  */
/* ------------------------------------------------------------------ */

function toServerDTO(
  row: typeof server.$inferSelect,
  lastSeenAt?: Date | null,
): ServerDTO {
  const stale =
    row.status === "online" &&
    (!lastSeenAt || Date.now() - lastSeenAt.getTime() > OFFLINE_THRESHOLD_MS);
  return {
    id: row.id,
    name: row.name,
    ownerId: row.ownerId,
    mediaPath: row.mediaPath,
    hostAgentId: row.hostAgentId,
    desiredState: row.desiredState,
    preferredPort: row.preferredPort,
    status: stale ? "offline" : (row.status as ServerDTO["status"]),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/* ------------------------------------------------------------------ */
/*  Read operations                                                    */
/* ------------------------------------------------------------------ */

/** Get a single server by ID. */
export async function getServerById(
  id: string,
): Promise<Result<ServerDTO, "not_found">> {
  const rows = await db
    .select({ server, lastSeenAt: hostDevice.lastSeenAt })
    .from(server)
    .leftJoin(hostDevice, eq(hostDevice.serverId, server.id))
    .where(eq(server.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) return err("not_found");
  return ok(toServerDTO(row.server, row.lastSeenAt));
}

/** List all servers owned by a user. */
export async function listServersByOwner(
  ownerId: string,
): Promise<ServerDTO[]> {
  const rows = await db
    .select({ server, lastSeenAt: hostDevice.lastSeenAt })
    .from(server)
    .leftJoin(hostDevice, eq(hostDevice.serverId, server.id))
    .where(eq(server.ownerId, ownerId))
    .orderBy(desc(server.createdAt));
  return rows.map((row) => toServerDTO(row.server, row.lastSeenAt));
}

/** List logical servers assigned to a paired host agent. */
export async function listServersByHostAgentId(
  hostAgentId: string,
): Promise<ServerDTO[]> {
  const rows = await db
    .select()
    .from(server)
    .where(eq(server.hostAgentId, hostAgentId))
    .orderBy(desc(server.createdAt));
  return rows.map((row) => toServerDTO(row));
}

/** Verify that the caller owns the server. */
export async function verifyOwnership(
  serverId: string,
  userId: string,
): Promise<Result<ServerDTO, "not_found" | "forbidden">> {
  const result = await getServerById(serverId);
  if (!result.ok) return err(result.error);
  if (result.data.ownerId !== userId) return err("forbidden");
  return ok(result.data);
}

/* ------------------------------------------------------------------ */
/*  Write operations                                                   */
/* ------------------------------------------------------------------ */

/** Create a new server. */
export async function createServer(input: {
  name: string;
  ownerId: string;
  mediaPath: string;
  hostAgentId?: string;
  preferredPort?: number;
}): Promise<ServerDTO> {
  const id = nanoid();
  const now = new Date();
  const rows = await db
    .insert(server)
    .values({
      id,
      name: input.name,
      ownerId: input.ownerId,
      mediaPath: input.mediaPath,
      hostAgentId: input.hostAgentId,
      preferredPort: input.preferredPort,
      desiredState: "running",
      status: input.hostAgentId ? "starting" : "offline",
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return toServerDTO(rows[0]);
}

/** Update server metadata (name, status). */
export async function updateServer(
  id: string,
  patch: Partial<Pick<ServerDTO, "name" | "status" | "mediaPath">>,
): Promise<Result<ServerDTO, "not_found">> {
  const rows = await db
    .update(server)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(server.id, id))
    .returning();
  const row = rows[0];
  if (!row) return err("not_found");
  return ok(toServerDTO(row));
}

/** Delete a server and cascade to children. */
export async function deleteServer(
  id: string,
): Promise<Result<void, "not_found">> {
  const deleted = await db.delete(server).where(eq(server.id, id)).returning();
  if (deleted.length === 0) return err("not_found");
  return ok(undefined);
}
