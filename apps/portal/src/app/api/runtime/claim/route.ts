/**
 * Host claim route handler.
 * LAN Hosts claim their server registration.
 *
 * Requires a valid access token in the Authorization header.
 * Must NOT be cached.
 */
export const dynamic = "force-dynamic";

import { logger } from "@/lib/logger";
import { handleClaim } from "@/server/runtime/claim";
import { extractBearerToken } from "@/server/security/tokens";
import { enforceRequestRateLimit } from "@/server/security/request-rate-limit";

export async function POST(request: Request) {
  const rateLimited = enforceRequestRateLimit(request, "runtime:claim", 10);
  if (rateLimited) {
    logger.warn("RUNTIME", "Rate limit exceeded on runtime:claim");
    return rateLimited;
  }
  const body = await request.json().catch(() => null);
  const authHeader = request.headers.get("authorization");
  const accessToken = extractBearerToken(authHeader);

  const result = await handleClaim(body, accessToken);
  if (!result.ok) {
    logger.warn("RUNTIME", `Host claim failed: ${result.error}`);
    const status =
      result.error === "unauthorized"
        ? 401
        : result.error === "token_expired"
          ? 401
          : result.error === "token_invalid"
            ? 403
            : 400;
    return Response.json(
      {
        data: null,
        error: {
          code: result.error,
          message: result.error,
        },
      },
      { status },
    );
  }

  logger.info("RUNTIME", `Host claimed server ID: ${result.data.serverId}`);
  return Response.json({ data: result.data, error: null });
}
