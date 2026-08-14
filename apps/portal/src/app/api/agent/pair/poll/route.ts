export const dynamic = "force-dynamic";

import { logger } from "@/lib/logger";
import { consumeAgentPairing } from "@/server/dal/agent-pairings";
import { enforceRequestRateLimit } from "@/server/security/request-rate-limit";
import { extractBearerToken } from "@/server/security/tokens";

export async function POST(request: Request) {
  const rateLimited = enforceRequestRateLimit(request, "agent:pair:poll", 120);
  if (rateLimited) return rateLimited;
  const secret = extractBearerToken(request.headers.get("authorization"));
  if (!secret) {
    logger.warn("PAIRING", "Polling attempt missing authorization header");
    return Response.json(
      {
        data: null,
        error: { code: "unauthorized", message: "Pairing secret required" },
      },
      { status: 401 },
    );
  }
  const result = await consumeAgentPairing(secret);
  if (result.status === "pending") {
    return Response.json(
      { data: { status: "pending" }, error: null },
      { status: 202 },
    );
  }
  if (result.status === "connected") {
    logger.info("PAIRING", `Pairing completed for host agent ID: ${result.agentId}`);
    return Response.json({ data: result, error: null });
  }
  const status = result.status === "expired" ? 410 : 409;
  logger.warn("PAIRING", `Pairing poll failed with status: ${result.status}`);
  return Response.json(
    { data: null, error: { code: result.status, message: result.status } },
    { status },
  );
}
