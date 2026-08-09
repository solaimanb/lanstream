/**
 * Better Auth catch-all route handler.
 * Handles all auth-related HTTP endpoints under /api/auth/*.
 */
import { auth } from "@/server/auth";
import { enforceRequestRateLimit } from "@/server/security/request-rate-limit";
import { toNextJsHandler } from "better-auth/next-js";

const handlers = toNextJsHandler(auth);

export const GET = handlers.GET;

export function POST(request: Request) {
  const rateLimited = enforceRequestRateLimit(request, "auth", 20);
  return rateLimited ?? handlers.POST(request);
}
