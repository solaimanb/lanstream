export const dynamic = "force-dynamic";

import { handleAgentHeartbeat } from "@/server/runtime/agent-heartbeat";
import { enforceRequestRateLimit } from "@/server/security/request-rate-limit";
import { extractBearerToken } from "@/server/security/tokens";

export async function POST(request: Request) {
  const rateLimited = enforceRequestRateLimit(request, "agent:heartbeat", 120);
  if (rateLimited) return rateLimited;
  const input = await request.json().catch(() => null);
  const result = await handleAgentHeartbeat(
    input,
    extractBearerToken(request.headers.get("authorization")),
  );
  if (!result.ok) {
    return Response.json(
      { data: null, error: { code: result.error, message: result.error } },
      { status: result.error === "unauthorized" ? 401 : 400 },
    );
  }
  return Response.json({ data: result.data, error: null });
}
