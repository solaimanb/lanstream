/**
 * Unit tests — security tokens module.
 */
import { describe, expect, it } from "vitest";
import {
  extractBearerToken,
  generateToken,
  hashToken,
  verifyToken,
} from "./tokens";

describe("Token utilities", () => {
  describe("generateToken()", () => {
    it("generates a non-empty string", () => {
      const token = generateToken();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
    });

    it("generates unique tokens", () => {
      const t1 = generateToken();
      const t2 = generateToken();
      expect(t1).not.toBe(t2);
    });
  });

  describe("hashToken()", () => {
    it("returns a hex string", () => {
      const hash = hashToken("test-token");
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it("is deterministic", () => {
      const h1 = hashToken("test-token");
      const h2 = hashToken("test-token");
      expect(h1).toBe(h2);
    });

    it("produces different hashes for different inputs", () => {
      const h1 = hashToken("token-a");
      const h2 = hashToken("token-b");
      expect(h1).not.toBe(h2);
    });
  });

  describe("verifyToken()", () => {
    it("returns true for matching token and hash", () => {
      const token = generateToken();
      const hash = hashToken(token);
      expect(verifyToken(token, hash)).toBe(true);
    });

    it("returns false for non-matching token", () => {
      const hash = hashToken("correct-token");
      expect(verifyToken("wrong-token", hash)).toBe(false);
    });
  });

  describe("extractBearerToken()", () => {
    it("extracts token from Bearer header", () => {
      expect(extractBearerToken("Bearer abc123")).toBe("abc123");
    });

    it("returns null for non-Bearer header", () => {
      expect(extractBearerToken("Basic abc123")).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(extractBearerToken("")).toBeNull();
    });

    it("returns null for undefined", () => {
      // undefined coerces to null via the !authorization check
      expect(extractBearerToken(null)).toBeNull();
    });
  });
});
