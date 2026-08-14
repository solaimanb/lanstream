/**
 * Host release route handler.
 * LAN Hosts notify when they go offline.
 */
import { logger } from "@/lib/logger";
import { handleRelease } from "@/server/runtime/release";
import { extractBearerToken } from "@/server/security/tokens";
import { enforceRequestRateLimit } from "@/server/security/request-rate-limit";

export async function POST(request: Request) {
  const rateLimited = enforceRequestRateLimit(request, "runtime:release", 20);
  if (rateLimited) return rateLimited;
  const body = await request.json().catch(() => null);
  const accessToken = extractBearerToken(request.headers.get("authorization"));
  const result = await handleRelease(body, accessToken);
  if (!result.ok) {
    logger.warn("RUNTIME", `Host release failed: ${result.error}`);
    const status =
      result.error === "unauthorized" || result.error === "token_expired"
        ? 401
        : result.error === "token_invalid"
          ? 403
          : result.error === "not_found"
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

  logger.info("RUNTIME", "Host released device registration cleanly");
  return Response.json({ data: { released: true }, error: null });
}
