import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleAgentHeartbeat } from "./agent-heartbeat";

const mocks = vi.hoisted(() => ({
  authenticateHostAgent: vi.fn(),
  touchHostAgent: vi.fn(),
  listServersByHostAgentId: vi.fn(),
  updateServer: vi.fn(),
  upsertHostDevice: vi.fn(),
  listActiveAccessTokenHashes: vi.fn(),
}));

vi.mock("@/server/dal/host-agents", () => ({
  authenticateHostAgent: mocks.authenticateHostAgent,
  touchHostAgent: mocks.touchHostAgent,
}));
vi.mock("@/server/dal/servers", () => ({
  listServersByHostAgentId: mocks.listServersByHostAgentId,
  updateServer: mocks.updateServer,
}));
vi.mock("@/server/dal/host-devices", () => ({
  upsertHostDevice: mocks.upsertHostDevice,
}));
vi.mock("@/server/dal/access-links", () => ({
  listActiveAccessTokenHashes: mocks.listActiveAccessTokenHashes,
}));

const serverId = "123e4567-e89b-42d3-a456-426614174001";
const input = {
  hostDeviceInfo: {
    hostname: "media-pc",
    platform: "linux",
    version: "0.1.0",
    localIp: "192.168.1.10",
  },
  servers: [{ serverId, status: "online", port: 4780 }],
};

describe("handleAgentHeartbeat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateHostAgent.mockResolvedValue({ id: "agent-1" });
    mocks.listServersByHostAgentId.mockResolvedValue([
      {
        id: serverId,
        name: "Movies",
        mediaPath: "/media/movies",
        preferredPort: 4780,
        desiredState: "running",
      },
    ]);
    mocks.listActiveAccessTokenHashes.mockResolvedValue(["guest-hash"]);
  });

  it("rejects an invalid agent credential", async () => {
    mocks.authenticateHostAgent.mockResolvedValue(null);
    await expect(handleAgentHeartbeat(input, "bad-token")).resolves.toEqual({
      ok: false,
      error: "unauthorized",
    });
    expect(mocks.updateServer).not.toHaveBeenCalled();
  });

  it("reports state and returns desired assignments", async () => {
    await expect(handleAgentHeartbeat(input, "agent-token")).resolves.toEqual({
      ok: true,
      data: {
        acknowledged: true,
        nextIntervalMs: 10_000,
        assignments: [
          {
            serverId,
            name: "Movies",
            mediaPath: "/media/movies",
            port: 4780,
            desiredState: "running",
            accessTokenHashes: ["guest-hash"],
          },
        ],
      },
    });
    expect(mocks.updateServer).toHaveBeenCalledWith(serverId, {
      status: "online",
    });
    expect(mocks.upsertHostDevice).toHaveBeenCalledWith({
      serverId,
      info: { ...input.hostDeviceInfo, port: 4780 },
    });
  });
});
