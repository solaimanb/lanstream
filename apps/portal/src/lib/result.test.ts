/**
 * Unit tests — Result<T, E> helper.
 */
import { describe, expect, it } from "vitest";
import { err, ok } from "./result";

describe("Result helpers", () => {
  describe("ok()", () => {
    it("creates a successful result", () => {
      const result = ok("hello");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe("hello");
      }
    });

    it("creates a result with complex data", () => {
      const data = { id: 1, name: "test", items: [1, 2, 3] };
      const result = ok(data);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual(data);
      }
    });
  });

  describe("err()", () => {
    it("creates an error result", () => {
      const result = err("not_found");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("not_found");
      }
    });

    it("creates an error result with Error object", () => {
      const error = new Error("something went wrong");
      const result = err(error);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe("something went wrong");
      }
    });
  });

  describe("discriminated union pattern", () => {
    it("narrows correctly with if/else", () => {
      const result = ok(42);

      if (result.ok) {
        // TypeScript narrows to { ok: true, data: number }
        expect(typeof result.data).toBe("number");
      } else {
        throw new Error("Should not reach here");
      }
    });

    it("narrows correctly for error case", () => {
      const result = err("forbidden");

      if (!result.ok) {
        // TypeScript narrows to { ok: false, error: string }
        expect(result.error).toBe("forbidden");
      } else {
        throw new Error("Should not reach here");
      }
    });
  });
});
