import type { Result } from "@/lib/result";
import { err, ok } from "@/lib/result";
import { db } from "@/server/db/client";
import { agentPairing, hostAgent } from "@/server/db/schema";
import { generateToken, hashToken } from "@/server/security/tokens";
import { and, eq } from "drizzle-orm";
import { randomInt } from "node:crypto";
import "server-only";
import { nanoid } from "./utils";

const PAIRING_TTL_MS = 10 * 60_000;

function generateUserCode(): string {
  return `${randomInt(1000, 10_000)}-${randomInt(1000, 10_000)}`;
}

function normalizeUserCode(code: string): string {
  return code.trim().toUpperCase();
}

export async function createAgentPairing(input: {
  requestedName: string;
  hostname: string;
  platform: string;
  version: string;
  localIp: string;
}) {
  const secret = `lanstp_${generateToken()}`;
  const userCode = generateUserCode();
  const expiresAt = new Date(Date.now() + PAIRING_TTL_MS);
  await db.insert(agentPairing).values({
    id: nanoid(),
    secretHash: hashToken(secret),
    userCodeHash: hashToken(normalizeUserCode(userCode)),
    requestedName: input.requestedName,
    hostname: input.hostname,
    platform: input.platform,
    version: input.version,
    localIp: input.localIp,
    status: "pending",
    expiresAt,
    createdAt: new Date(),
  });
  return {
    secret,
    userCode,
    expiresAt,
    expiresInSeconds: PAIRING_TTL_MS / 1000,
  };
}

export async function approveAgentPairing(
  userCode: string,
  ownerId: string,
): Promise<Result<{ requestedName: string }, "invalid" | "expired">> {
  const rows = await db
    .select()
    .from(agentPairing)
    .where(
      eq(agentPairing.userCodeHash, hashToken(normalizeUserCode(userCode))),
    )
    .limit(1);
  const pairing = rows[0];
  if (!pairing) return err("invalid");
  if (pairing.expiresAt <= new Date()) return err("expired");
  if (pairing.status === "consumed") return err("invalid");
  if (pairing.status === "approved") {
    return pairing.ownerId === ownerId
      ? ok({ requestedName: pairing.requestedName })
      : err("invalid");
  }

  const approved = await db
    .update(agentPairing)
    .set({ status: "approved", ownerId, approvedAt: new Date() })
    .where(
      and(eq(agentPairing.id, pairing.id), eq(agentPairing.status, "pending")),
    )
    .returning({ requestedName: agentPairing.requestedName });
  return approved[0] ? ok(approved[0]) : err("invalid");
}

export type PairingPollResult =
  | { status: "pending" }
  | { status: "connected"; token: string; agentId: string }
  | { status: "expired" }
  | { status: "consumed" }
  | { status: "invalid" };

export async function consumeAgentPairing(
  secret: string,
): Promise<PairingPollResult> {
  const rows = await db
    .select()
    .from(agentPairing)
    .where(eq(agentPairing.secretHash, hashToken(secret)))
    .limit(1);
  const pairing = rows[0];
  if (!pairing) return { status: "invalid" };
  if (pairing.expiresAt <= new Date()) return { status: "expired" };
  if (pairing.status === "pending") return { status: "pending" };
  if (pairing.status === "consumed") return { status: "consumed" };
  if (!pairing.ownerId) return { status: "invalid" };

  return db.transaction(async (tx) => {
    const claimed = await tx
      .update(agentPairing)
      .set({ status: "consumed", consumedAt: new Date() })
      .where(
        and(
          eq(agentPairing.id, pairing.id),
          eq(agentPairing.status, "approved"),
        ),
      )
      .returning({ id: agentPairing.id });
    if (!claimed[0]) return { status: "consumed" } as const;

    const token = `lansta_${generateToken()}`;
    const agentId = nanoid();
    await tx.insert(hostAgent).values({
      id: agentId,
      ownerId: pairing.ownerId!,
      name: pairing.requestedName,
      tokenHash: hashToken(token),
      tokenPrefix: token.slice(0, 13),
      hostname: pairing.hostname,
      platform: pairing.platform,
      version: pairing.version,
      localIp: pairing.localIp,
      lastSeenAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return { status: "connected", token, agentId } as const;
  });
}
