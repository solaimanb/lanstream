/**
 * Token generation and validation utilities.
 *
 * Used for access link tokens, API keys, and other
 * bearer-style authentication tokens.
 */
import { randomBytes } from "node:crypto";
import "server-only";
import { sha256, timingSafeEqual } from "./hashing";

/** Generate a URL-safe token (32 bytes → 43 chars base64url). */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Hash a token for storage (tokens are stored hashed, never raw). */
export function hashToken(token: string): string {
  return sha256(token);
}

/** Verify a raw token against a stored hash. */
export function verifyToken(rawToken: string, storedHash: string): boolean {
  const computed = hashToken(rawToken);
  return timingSafeEqual(computed, storedHash);
}

/** Extract a bearer token from an Authorization header. */
export function extractBearerToken(
  authorization: string | null,
): string | null {
  if (!authorization) return null;
  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}
