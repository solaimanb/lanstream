/**
 * Host heartbeat route handler.
 * LAN Hosts send periodic heartbeat updates.
 * Must NOT be cached — depends on request-time data.
 */
export const dynamic = "force-dynamic";

import { logger } from "@/lib/logger";
import { handleHeartbeat } from "@/server/runtime/heartbeat";
import { extractBearerToken } from "@/server/security/tokens";
import { enforceRequestRateLimit } from "@/server/security/request-rate-limit";

export async function POST(request: Request) {
  const rateLimited = enforceRequestRateLimit(request, "runtime:heartbeat", 120);
  if (rateLimited) return rateLimited;
  const body = await request.json().catch(() => null);
  const accessToken = extractBearerToken(request.headers.get("authorization"));
  const result = await handleHeartbeat(body, accessToken);
  if (!result.ok) {
    logger.warn("RUNTIME", `Heartbeat tick failed: ${result.error}`);
    const status =
      result.error === "unauthorized" || result.error === "token_expired"
        ? 401
        : result.error === "token_invalid"
          ? 403
          : result.error === "device_not_found" ||
              result.error === "server_not_found"
            ? 404
            : 400;
    return Response.json(
      {
        data: null,
        error: { code: result.error, message: result.error },
      },
      { status },
    );
  }

  logger.debug("RUNTIME", `Heartbeat acknowledged for media path: ${result.data.mediaPath}`);
  return Response.json({ data: result.data, error: null });
}
