/**
 * Unit tests — security hashing module.
 */
import { describe, expect, it } from "vitest";
import { randomHex, sha256, timingSafeEqual } from "./hashing";

describe("Hashing utilities", () => {
  describe("sha256()", () => {
    it("returns a 64-char hex string", () => {
      const hash = sha256("hello");
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it("is deterministic", () => {
      expect(sha256("test")).toBe(sha256("test"));
    });

    it("produces different output for different input", () => {
      expect(sha256("a")).not.toBe(sha256("b"));
    });
  });

  describe("timingSafeEqual()", () => {
    it("returns true for equal strings", () => {
      expect(timingSafeEqual("abc", "abc")).toBe(true);
    });

    it("returns false for different strings", () => {
      expect(timingSafeEqual("abc", "abd")).toBe(false);
    });

    it("returns false for different lengths", () => {
      expect(timingSafeEqual("abc", "abcd")).toBe(false);
    });
  });

  describe("randomHex()", () => {
    it("returns the requested number of hex characters (bytes * 2)", () => {
      expect(randomHex(8)).toMatch(/^[a-f0-9]{16}$/);
      expect(randomHex(16)).toMatch(/^[a-f0-9]{32}$/);
    });

    it("generates unique values", () => {
      const a = randomHex(16);
      const b = randomHex(16);
      expect(a).not.toBe(b);
    });
  });
});
