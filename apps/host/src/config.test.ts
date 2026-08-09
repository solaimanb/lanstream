/**
 * Unit tests — host configuration loader.
 */
import { describe, expect, it } from "vitest";
import { loadConfig } from "./config";

describe("loadConfig()", () => {
  it("loads with valid overrides", () => {
    const config = loadConfig({
      portalUrl: "http://localhost:3000",
      serverId: "123e4567-e89b-42d3-a456-426614174001",
      accessToken: "test-access-token",
      port: 4780,
      mediaPath: "./media",
      heartbeatIntervalMs: 30000,
    });

    expect(config.portalUrl).toBe("http://localhost:3000");
    expect(config.serverId).toBe("123e4567-e89b-42d3-a456-426614174001");
    expect(config.accessToken).toBe("test-access-token");
    expect(config.port).toBe(4780);
    expect(config.mediaPath).toBe("./media");
    expect(config.heartbeatIntervalMs).toBe(30000);
  });

  it("applies default values", () => {
    const config = loadConfig({
      portalUrl: "http://localhost:3000",
      serverId: "123e4567-e89b-42d3-a456-426614174001",
      accessToken: "test-access-token",
    });

    expect(config.port).toBe(4780);
    expect(config.mediaPath).toBe("./media");
    expect(config.heartbeatIntervalMs).toBe(30000);
  });

  it("rejects invalid URL", () => {
    expect(() =>
      loadConfig({
        portalUrl: "not-a-url",
        serverId: "123e4567-e89b-42d3-a456-426614174001",
        accessToken: "test-access-token",
      }),
    ).toThrow("Invalid host configuration");
  });

  it("rejects invalid UUID", () => {
    expect(() =>
      loadConfig({
        portalUrl: "http://localhost:3000",
        serverId: "not-a-uuid",
        accessToken: "test-access-token",
      }),
    ).toThrow("Invalid host configuration");
  });

  it("rejects port out of range", () => {
    expect(() =>
      loadConfig({
        portalUrl: "http://localhost:3000",
        serverId: "123e4567-e89b-42d3-a456-426614174001",
        accessToken: "test-access-token",
        port: 80,
      }),
    ).toThrow("Invalid host configuration");
  });

  it("supports paired agent mode without server-specific credentials", () => {
    const config = loadConfig({
      portalUrl: "http://localhost:3000",
      agentToken: "agent-token",
    });
    expect(config.agentToken).toBe("agent-token");
    expect(config.serverId).toBeUndefined();
  });

  it("allows an unconfigured first run so the agent can self-pair", () => {
    const config = loadConfig({
      portalUrl: "http://localhost:3000",
    });
    expect(config.agentToken).toBeUndefined();
    expect(config.serverId).toBeUndefined();
  });
});
