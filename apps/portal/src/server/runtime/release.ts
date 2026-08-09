/**
 * Runtime service — host release.
 *
 * When a LAN Host gracefully shuts down, it releases ownership
 * of its server, which updates the server status to offline.
 */
import type { Result } from "@/lib/result";
import { err, ok } from "@/lib/result";
import { validateAccessToken } from "@/server/dal/access-links";
import { createAuditEvent } from "@/server/dal/audit-events";
import {
  deleteHostDevice,
  getHostDeviceById,
} from "@/server/dal/host-devices";
import { updateServer } from "@/server/dal/servers";
import { releaseSchema } from "@/server/validation/runtime";
import "server-only";

/* ------------------------------------------------------------------ */
/*  Service                                                            */
/* ------------------------------------------------------------------ */

/**
 * Process a host release request.
 *
 * Removes the host device and marks the server as offline.
 */
export async function handleRelease(
  input: unknown,
  accessToken: string | null,
): Promise<
  Result<
    void,
    | "validation_error"
    | "unauthorized"
    | "token_invalid"
    | "token_expired"
    | "not_found"
  >
> {
  const parsed = releaseSchema.safeParse(input);
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

  const device = await getHostDeviceById(parsed.data.hostDeviceId);
  if (!device.ok || device.data.serverId !== parsed.data.serverId) {
    return err("not_found");
  }

  // Remove host device
  const result = await deleteHostDevice(parsed.data.hostDeviceId);
  if (!result.ok) return err(result.error);

  // Set server offline
  await updateServer(parsed.data.serverId, { status: "offline" });

  await createAuditEvent({
    action: "host.released",
    targetType: "server",
    targetId: parsed.data.serverId,
    metadata: { hostDeviceId: parsed.data.hostDeviceId },
  });

  return ok(undefined);
}
