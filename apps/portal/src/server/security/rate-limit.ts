/**
 * In-memory sliding window rate limiter.
 *
 * Suitable for single-instance deployments. For multi-instance,
 * use Redis-backed rate limiting instead.
 */
import "server-only";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

/* ------------------------------------------------------------------ */
/*  Configuration                                                      */
/* ------------------------------------------------------------------ */

const DEFAULT_WINDOW_MS = 60_000; // 1 minute
const DEFAULT_MAX_REQUESTS = 60;

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check whether a request is within the rate limit.
 *
 * @param key     Unique identifier (e.g. IP + route)
 * @param limit   Max requests in the window (default 60)
 * @param window  Window duration in ms (default 60s)
 */
export function checkRateLimit(
  key: string,
  limit = DEFAULT_MAX_REQUESTS,
  window = DEFAULT_WINDOW_MS,
): RateLimitResult {
  if (store.size > 10_000) cleanupRateLimitStore();
  const now = Date.now();
  const entry = store.get(key);

  // Expired or missing — reset
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + window });
    return { allowed: true, remaining: limit - 1, resetAt: now + window };
  }

  entry.count++;

  if (entry.count > limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return {
    allowed: true,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
  };
}

/** Clean up expired entries (call periodically or on request). */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}
