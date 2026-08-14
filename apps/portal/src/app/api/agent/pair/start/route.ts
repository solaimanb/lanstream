export const dynamic = "force-dynamic";

import { PORTAL_URL } from "@/lib/env";
import { logger } from "@/lib/logger";
import { createAgentPairing } from "@/server/dal/agent-pairings";
import { enforceRequestRateLimit } from "@/server/security/request-rate-limit";
import { z } from "zod";

const schema = z.object({
  requestedName: z.string().trim().min(1).max(64),
  hostDeviceInfo: z.object({
    hostname: z.string().min(1).max(255),
    platform: z.string().min(1).max(127),
    version: z.string().min(1).max(63),
    localIp: z.union([z.ipv4(), z.ipv6()]),
  }),
});

export async function POST(request: Request) {
  const rateLimited = enforceRequestRateLimit(request, "agent:pair:start", 20);
  if (rateLimited) {
    logger.warn("PAIRING", "Rate limit exceeded on agent:pair:start");
    return rateLimited;
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    logger.warn("PAIRING", "Invalid agent:pair:start payload", { issues: parsed.error.issues });
    return Response.json(
      {
        data: null,
        error: { code: "validation_error", message: "Invalid pairing request" },
      },
      { status: 400 },
    );
  }
  const pairing = await createAgentPairing({
    requestedName: parsed.data.requestedName,
    ...parsed.data.hostDeviceInfo,
  });
  const verificationUrl = new URL("/hosts/pair", PORTAL_URL);
  verificationUrl.searchParams.set("code", pairing.userCode);

  logger.info("PAIRING", `Started pairing request for "${parsed.data.requestedName}"`, {
    userCode: pairing.userCode,
    hostname: parsed.data.hostDeviceInfo.hostname,
  });

  return Response.json({
    data: {
      pairingSecret: pairing.secret,
      userCode: pairing.userCode,
      verificationUrl: verificationUrl.toString(),
      expiresInSeconds: pairing.expiresInSeconds,
    },
    error: null,
  });
}
