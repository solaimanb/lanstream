/**
 * Runtime service — heartbeat.
 *
 * LAN Hosts send periodic heartbeat updates to confirm they are alive.
 * The portal tracks the last-seen timestamp and updates server status.
 */
import { HEARTBEAT_INTERVAL_MS } from "@/lib/constants";
import type { Result } from "@/lib/result";
import { err, ok } from "@/lib/result";
import {
  listActiveAccessTokenHashes,
  validateAccessToken,
} from "@/server/dal/access-links";
import {
  getHostDeviceById,
  touchHostDevice,
  upsertHostDevice,
} from "@/server/dal/host-devices";
import { updateServer } from "@/server/dal/servers";
import { heartbeatSchema } from "@/server/validation/runtime";
import "server-only";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface HeartbeatResult {
  acknowledged: boolean;
  nextIntervalMs: number;
  accessTokenHashes: string[];
  mediaPath: string;
}

/* ------------------------------------------------------------------ */
/*  Service                                                            */
/* ------------------------------------------------------------------ */

/**
 * Process a heartbeat request from a LAN Host.
 *
 * Updates the host device's lastSeenAt and ensures the
 * server is marked as online.
 */
export async function handleHeartbeat(
  input: unknown,
  accessToken: string | null,
): Promise<
  Result<
    HeartbeatResult,
    | "validation_error"
    | "unauthorized"
    | "token_invalid"
    | "token_expired"
    | "device_not_found"
    | "server_not_found"
  >
> {
  const parsed = heartbeatSchema.safeParse(input);
  if (!parsed.success) return err("validation_error");

  if (!accessToken) return err("unauthorized");
  const tokenResult = await validateAccessToken(accessToken);
  if (!tokenResult.ok) {
    return err(
      tokenResult.error === "expired" ? "token_expired" : "token_invalid",
    );
  }
  if (tokenResult.data.serverId !== parsed.data.serverId) {
    return err("token_invalid");
  }
  if (tokenResult.data.purpose !== "host") return err("token_invalid");

  // Verify the device exists
  const device = await getHostDeviceById(parsed.data.hostDeviceId);
  if (!device.ok) return err("device_not_found");
  if (device.data.serverId !== parsed.data.serverId) {
    return err("device_not_found");
  }

  if (parsed.data.hostDeviceInfo) {
    await upsertHostDevice({
      serverId: parsed.data.serverId,
      info: parsed.data.hostDeviceInfo,
    });
  } else {
    await touchHostDevice(parsed.data.hostDeviceId);
  }

  const serverResult = await updateServer(parsed.data.serverId, {
    status: parsed.data.status,
  });
  if (!serverResult.ok) return err("server_not_found");

  return ok({
    acknowledged: true,
    nextIntervalMs: HEARTBEAT_INTERVAL_MS,
    accessTokenHashes: await listActiveAccessTokenHashes(parsed.data.serverId),
    mediaPath: serverResult.data.mediaPath,
  });
}
