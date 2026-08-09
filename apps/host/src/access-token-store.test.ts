import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { AccessTokenStore } from "./access-token-store";

const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");

describe("AccessTokenStore", () => {
  it("validates active tokens and rejects unknown tokens", () => {
    const store = new AccessTokenStore();
    store.replace([hash("active-token")]);

    expect(store.validate("active-token")).toBe(true);
    expect(store.validate("unknown-token")).toBe(false);
  });

  it("replaces the previous token set on synchronization", () => {
    const store = new AccessTokenStore();
    store.replace([hash("old-token")]);
    store.replace([hash("new-token")]);

    expect(store.validate("old-token")).toBe(false);
    expect(store.validate("new-token")).toBe(true);
  });

  it("ignores malformed hashes", () => {
    const store = new AccessTokenStore();
    store.replace(["not-a-sha256-hash"]);
    expect(store.validate("anything")).toBe(false);
  });
});
