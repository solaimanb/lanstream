/**
 * Data Access Layer — host devices.
 *
 * Manages the physical machines running the LAN Host app.
 * Each host device is linked to exactly one server.
 */
import type { Result } from "@/lib/result";
import { err, ok } from "@/lib/result";
import { db } from "@/server/db/client";
import { hostDevice } from "@/server/db/schema";
import type { HostDeviceInfo } from "@/types";
import { eq } from "drizzle-orm";
import "server-only";
import { nanoid } from "./utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface HostDeviceDTO {
  id: string;
  serverId: string;
  hostname: string;
  platform: string;
  version: string;
  localIp: string;
  port: number;
  lastSeenAt: Date | null;
  createdAt: Date;
}

function toDTO(row: typeof hostDevice.$inferSelect): HostDeviceDTO {
  return {
    id: row.id,
    serverId: row.serverId,
    hostname: row.hostname,
    platform: row.platform,
    version: row.version,
    localIp: row.localIp,
    port: row.port,
    lastSeenAt: row.lastSeenAt,
    createdAt: row.createdAt,
  };
}

/* ------------------------------------------------------------------ */
/*  Read operations                                                    */
/* ------------------------------------------------------------------ */

/** Get host device by ID. */
export async function getHostDeviceById(
  id: string,
): Promise<Result<HostDeviceDTO, "not_found">> {
  const rows = await db
    .select()
    .from(hostDevice)
    .where(eq(hostDevice.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) return err("not_found");
  return ok(toDTO(row));
}

/** Get the host device for a given server. */
export async function getHostDeviceByServerId(
  serverId: string,
): Promise<HostDeviceDTO | null> {
  const rows = await db
    .select()
    .from(hostDevice)
    .where(eq(hostDevice.serverId, serverId))
    .limit(1);
  return rows[0] ? toDTO(rows[0]) : null;
}

/* ------------------------------------------------------------------ */
/*  Write operations                                                   */
/* ------------------------------------------------------------------ */

/** Upsert a host device (claim or update). */
export async function upsertHostDevice(input: {
  serverId: string;
  info: HostDeviceInfo;
}): Promise<HostDeviceDTO> {
  const existing = await getHostDeviceByServerId(input.serverId);

  if (existing) {
    const rows = await db
      .update(hostDevice)
      .set({
        hostname: input.info.hostname,
        platform: input.info.platform,
        version: input.info.version,
        localIp: input.info.localIp,
        port: input.info.port,
        lastSeenAt: new Date(),
      })
      .where(eq(hostDevice.id, existing.id))
      .returning();
    return toDTO(rows[0]);
  }

  const id = nanoid();
  const rows = await db
    .insert(hostDevice)
    .values({
      id,
      serverId: input.serverId,
      hostname: input.info.hostname,
      platform: input.info.platform,
      version: input.info.version,
      localIp: input.info.localIp,
      port: input.info.port,
      lastSeenAt: new Date(),
      createdAt: new Date(),
    })
    .returning();
  return toDTO(rows[0]);
}

/** Update lastSeenAt timestamp (heartbeat tick). */
export async function touchHostDevice(id: string): Promise<void> {
  await db
    .update(hostDevice)
    .set({ lastSeenAt: new Date() })
    .where(eq(hostDevice.id, id));
}

/** Remove a host device. */
export async function deleteHostDevice(
  id: string,
): Promise<Result<void, "not_found">> {
  const deleted = await db
    .delete(hostDevice)
    .where(eq(hostDevice.id, id))
    .returning();
  if (deleted.length === 0) return err("not_found");
  return ok(undefined);
}
