/**
 * Unit tests — server validation schemas.
 */
import { describe, expect, it } from "vitest";
import { createServerSchema, updateServerSchema } from "./servers";

describe("createServerSchema", () => {
  it("accepts a valid server name", () => {
    const result = createServerSchema.safeParse({ name: "My Server", mediaPath: "/home/user/Movies" });
    expect(result.success).toBe(true);
  });

  it("trims whitespace", () => {
    const result = createServerSchema.safeParse({ name: "  My Server  ", mediaPath: "  /home/user/Movies  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("My Server");
      expect(result.data.mediaPath).toBe("/home/user/Movies");
    }
  });

  it("rejects empty name", () => {
    const result = createServerSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name longer than 64 characters", () => {
    const result = createServerSchema.safeParse({ name: "a".repeat(65) });
    expect(result.success).toBe(false);
  });

  it("accepts name at exactly 64 characters", () => {
    const result = createServerSchema.safeParse({ name: "a".repeat(64), mediaPath: "/media" });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = createServerSchema.safeParse({ mediaPath: "/media" });
    expect(result.success).toBe(false);
  });

  it("rejects missing mediaPath", () => {
    const result = createServerSchema.safeParse({ name: "My Server" });
    expect(result.success).toBe(false);
  });
});

describe("updateServerSchema", () => {
  it("accepts a valid name update", () => {
    const result = updateServerSchema.safeParse({ name: "Updated Name" });
    expect(result.success).toBe(true);
  });

  it("accepts empty update (no name)", () => {
    const result = updateServerSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects empty string name", () => {
    const result = updateServerSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });
});
