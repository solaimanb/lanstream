import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadStoredAgentToken, saveAgentToken } from "./credential-store";

const originalConfigPath = process.env.LANSTREAM_CONFIG_PATH;

afterEach(() => {
  if (originalConfigPath === undefined) {
    delete process.env.LANSTREAM_CONFIG_PATH;
  } else {
    process.env.LANSTREAM_CONFIG_PATH = originalConfigPath;
  }
});

describe("agent credential store", () => {
  it("persists and reloads a credential for the matching portal", () => {
    const directory = mkdtempSync(join(tmpdir(), "lanstream-credential-"));
    const path = join(directory, "nested", "agent.json");
    process.env.LANSTREAM_CONFIG_PATH = path;

    saveAgentToken("https://portal.example.com/", "lansta_test-token");

    expect(loadStoredAgentToken("https://portal.example.com")).toBe(
      "lansta_test-token",
    );
    expect(loadStoredAgentToken("https://other.example.com")).toBeNull();
    expect(JSON.parse(readFileSync(path, "utf8"))).toEqual({
      portalUrl: "https://portal.example.com",
      agentToken: "lansta_test-token",
    });
    if (process.platform !== "win32") {
      expect(statSync(path).mode & 0o777).toBe(0o600);
    }
  });
});
