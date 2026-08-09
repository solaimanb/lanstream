/**
 * Cryptographic hashing utilities.
 *
 * Used for access token hashing, secrets derivation,
 * and other one-way hash operations.
 */
import {
  createHash,
  timingSafeEqual as nodeTimingSafeEqual,
  randomBytes,
} from "node:crypto";
import "server-only";

/** SHA-256 hash a string (hex-encoded). */
export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/** Constant-time string comparison to prevent timing attacks.
 *  Uses Node.js built-in crypto.timingSafeEqual for correctness.
 *  Returns false early when lengths differ (safe because stored
 *  hashes are always SHA-256 hex — 64 chars). */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return nodeTimingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/** Generate a cryptographically secure random hex string. */
export function randomHex(bytes: number): string {
  return randomBytes(bytes).toString("hex");
}
