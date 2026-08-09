/**
 * Host claim route handler.
 * LAN Hosts claim their server registration.
 *
 * Requires a valid access token in the Authorization header.
 */
import { handleClaim } from "@/server/runtime/claim";
import { extractBearerToken } from "@/server/security/tokens";
import { enforceRequestRateLimit } from "@/server/security/request-rate-limit";

export async function POST(request: Request) {
  const rateLimited = enforceRequestRateLimit(request, "runtime:claim", 10);
  if (rateLimited) return rateLimited;
  const body = await request.json().catch(() => null);
  const authHeader = request.headers.get("authorization");
  const accessToken = extractBearerToken(authHeader);

  const result = await handleClaim(body, accessToken);
  if (!result.ok) {
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
  return Response.json({ data: result.data, error: null });
}
