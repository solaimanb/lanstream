import "server-only";
import { checkRateLimit } from "./rate-limit";

function requestIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("cf-connecting-ip") || "unknown";
}

/** Return a 429 response when the request exceeds a route-specific limit. */
export function enforceRequestRateLimit(
  request: Request,
  scope: string,
  limit: number,
): Response | null {
  const result = checkRateLimit(`${scope}:${requestIp(request)}`, limit);
  if (result.allowed) return null;

  return Response.json(
    {
      data: null,
      error: { code: "rate_limited", message: "Too many requests" },
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(
          Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000)),
        ),
      },
    },
  );
}
