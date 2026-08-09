/**
 * Data Access Layer — access links.
 *
 * Manages revocable tokens for guest file streaming.
 * Tokens are stored hashed — raw tokens are only returned at creation time.
 */
import type { Result } from "@/lib/result";
import { err, ok } from "@/lib/result";
import { db } from "@/server/db/client";
import { accessLink } from "@/server/db/schema";
import { hashToken, generateToken } from "@/server/security/tokens";
import { and, desc, eq } from "drizzle-orm";
import "server-only";
import { nanoid } from "./utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Full access link DTO including server context. */
export interface AccessLinkDTO {
  id: string;
  serverId: string;
  tokenPrefix: string;
  purpose: "host" | "guest";
  description: string | null;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface CreatedAccessLinkDTO extends AccessLinkDTO {
  /** Raw token returned once at creation and never persisted. */
  token: string;
}

function toDTO(row: typeof accessLink.$inferSelect): AccessLinkDTO {
  return {
    id: row.id,
    serverId: row.serverId,
    tokenPrefix: row.tokenPrefix,
    purpose: row.purpose,
    description: row.description,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
  };
}

/* ------------------------------------------------------------------ */
/*  Read operations                                                    */
/* ------------------------------------------------------------------ */

/** Get access link by ID. */
export async function getAccessLinkById(
  id: string,
): Promise<Result<AccessLinkDTO, "not_found">> {
  const rows = await db
    .select()
    .from(accessLink)
    .where(eq(accessLink.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) return err("not_found");
  return ok(toDTO(row));
}

/** Validate an access link token — checks existence + expiry. */
export async function validateAccessToken(
  token: string,
): Promise<Result<AccessLinkDTO, "not_found" | "expired">> {
  const tokenHash = hashToken(token);
  const rows = await db
    .select()
    .from(accessLink)
    .where(eq(accessLink.tokenHash, tokenHash))
    .limit(1);
  const row = rows[0];
  if (!row) return err("not_found");
  if (row.expiresAt && row.expiresAt < new Date()) return err("expired");
  return ok(toDTO(row));
}

/** List active token hashes for local validation by the LAN Host. */
export async function listActiveAccessTokenHashes(
  serverId: string,
): Promise<string[]> {
  const rows = await db
    .select({ tokenHash: accessLink.tokenHash, expiresAt: accessLink.expiresAt })
    .from(accessLink)
    .where(
      and(
        eq(accessLink.serverId, serverId),
        eq(accessLink.purpose, "guest"),
      ),
    );
  const now = new Date();
  return rows
    .filter((row) => !row.expiresAt || row.expiresAt > now)
    .map((row) => row.tokenHash);
}

/** List all access links for a server. */
export async function listAccessLinksByServerId(
  serverId: string,
): Promise<AccessLinkDTO[]> {
  const rows = await db
    .select()
    .from(accessLink)
    .where(eq(accessLink.serverId, serverId))
    .orderBy(desc(accessLink.createdAt));
  return rows.map(toDTO);
}

/* ------------------------------------------------------------------ */
/*  Write operations                                                   */
/* ------------------------------------------------------------------ */

/** Create a new access link. Returns the raw token (shown once). */
export async function createAccessLink(input: {
  serverId: string;
  description?: string;
  expiresAt?: Date;
  purpose?: "host" | "guest";
}): Promise<CreatedAccessLinkDTO> {
  const id = nanoid();
  const token = `lanst_${generateToken()}`;
  const tokenHash = hashToken(token);
  const tokenPrefix = token.slice(0, 12);
  const now = new Date();
  const rows = await db
    .insert(accessLink)
    .values({
      id,
      serverId: input.serverId,
      tokenHash,
      tokenPrefix,
      purpose: input.purpose ?? "guest",
      description: input.description ?? null,
      expiresAt: input.expiresAt ?? null,
      createdAt: now,
    })
    .returning();
  return { ...toDTO(rows[0]), token };
}

/** Revoke (delete) an access link. */
export async function revokeAccessLink(
  id: string,
  serverId: string,
): Promise<Result<void, "not_found">> {
  const deleted = await db
    .delete(accessLink)
    .where(and(eq(accessLink.id, id), eq(accessLink.serverId, serverId)))
    .returning();
  if (deleted.length === 0) return err("not_found");
  return ok(undefined);
}
