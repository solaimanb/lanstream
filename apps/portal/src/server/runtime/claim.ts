/**
 * Runtime service — host claim.
 *
 * When a LAN Host first connects, it "claims" ownership of a server.
 * This registers the host device and links it to the server.
 *
 * Authorization: The host must present a valid access token (Bearer)
 * in the Authorization header. The token is verified against the
 * access_link table for the target server.
 */
import type { Result } from "@/lib/result";
import { err, ok } from "@/lib/result";
import {
  listActiveAccessTokenHashes,
  validateAccessToken,
} from "@/server/dal/access-links";
import { createAuditEvent } from "@/server/dal/audit-events";
import { upsertHostDevice } from "@/server/dal/host-devices";
import { updateServer } from "@/server/dal/servers";
import { claimSchema } from "@/server/validation/runtime";
import "server-only";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ClaimResult {
  hostDeviceId: string;
  serverId: string;
  mediaPath: string;
  accessTokenHashes: string[];
}

/* ------------------------------------------------------------------ */
/*  Service                                                            */
/* ------------------------------------------------------------------ */

/**
 * Process a host claim request.
 *
 * The host must present a valid access token in the Authorization
 * header. The token is verified against the access_link table to
 * ensure the host was authorized by the server owner.
 */
export async function handleClaim(
  input: unknown,
  accessToken: string | null,
): Promise<
  Result<
    ClaimResult,
    "validation_error" | "unauthorized" | "token_expired" | "token_invalid"
  >
> {
  const parsed = claimSchema.safeParse(input);
  if (!parsed.success) return err("validation_error");

  // Verify the access token against the database
  if (!accessToken) return err("unauthorized");

  const tokenResult = await validateAccessToken(accessToken);
  if (!tokenResult.ok) {
    return err(
      tokenResult.error === "expired" ? "token_expired" : "token_invalid",
    );
  }

  // Ensure the token belongs to the claimed server
  if (tokenResult.data.serverId !== parsed.data.serverId) {
    return err("token_invalid");
  }
  if (tokenResult.data.purpose !== "host") return err("token_invalid");

  // Upsert the host device record
  const device = await upsertHostDevice({
    serverId: parsed.data.serverId,
    info: parsed.data.hostDeviceInfo,
  });

  // Set server status to starting
  await updateServer(parsed.data.serverId, { status: "starting" });

  await createAuditEvent({
    action: "host.claimed",
    targetType: "server",
    targetId: parsed.data.serverId,
    metadata: {
      hostDeviceId: device.id,
      hostname: parsed.data.hostDeviceInfo.hostname,
    },
  });

  // Fetch the server to get the mediaPath
  const serverResult = await import("@/server/dal/servers").then((m) =>
    m.getServerById(parsed.data.serverId),
  );
  const mediaPath = serverResult.ok ? serverResult.data.mediaPath : "./media";

  return ok({
    hostDeviceId: device.id,
    serverId: parsed.data.serverId,
    mediaPath,
    accessTokenHashes: await listActiveAccessTokenHashes(parsed.data.serverId),
  });
}
