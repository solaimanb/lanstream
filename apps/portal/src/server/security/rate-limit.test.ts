/**
 * Unit tests — in-memory rate limiter.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit } from "./rate-limit";

describe("checkRateLimit()", () => {
  beforeEach(() => {
    // Rate limiter uses module-level state, so we test with fresh keys
  });

  it("allows requests within the limit", () => {
    const key = `test-${Date.now()}-1`;
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key, 10, 60).allowed).toBe(true);
    }
  });

  it("blocks requests over the limit", () => {
    const key = `test-${Date.now()}-2`;
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, 5, 60);
    }
    expect(checkRateLimit(key, 5, 60).allowed).toBe(false);
  });

  it("tracks different keys independently", () => {
    const base = `test-${Date.now()}-3`;
    const key1 = `${base}-a`;
    const key2 = `${base}-b`;

    for (let i = 0; i < 3; i++) {
      checkRateLimit(key1, 3, 60);
    }
    // key1 is exhausted
    expect(checkRateLimit(key1, 3, 60).allowed).toBe(false);
    // key2 should still work
    expect(checkRateLimit(key2, 3, 60).allowed).toBe(true);
  });

  it("returns remaining count", () => {
    const key = `test-${Date.now()}-4`;
    const r1 = checkRateLimit(key, 5, 60);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(4);
  });
});
