import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleHeartbeat } from "./heartbeat";

const mocks = vi.hoisted(() => ({
  validateAccessToken: vi.fn(),
  listActiveAccessTokenHashes: vi.fn(),
  getHostDeviceById: vi.fn(),
  touchHostDevice: vi.fn(),
  upsertHostDevice: vi.fn(),
  updateServer: vi.fn(),
}));

vi.mock("@/server/dal/access-links", () => ({
  validateAccessToken: mocks.validateAccessToken,
  listActiveAccessTokenHashes: mocks.listActiveAccessTokenHashes,
}));
vi.mock("@/server/dal/host-devices", () => ({
  getHostDeviceById: mocks.getHostDeviceById,
  touchHostDevice: mocks.touchHostDevice,
  upsertHostDevice: mocks.upsertHostDevice,
}));
vi.mock("@/server/dal/servers", () => ({
  updateServer: mocks.updateServer,
}));

const serverId = "123e4567-e89b-42d3-a456-426614174001";
const hostDeviceId = "123e4567-e89b-42d3-a456-426614174002";
const input = { serverId, hostDeviceId, status: "online" };

describe("handleHeartbeat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.validateAccessToken.mockResolvedValue({
      ok: true,
      data: { serverId, purpose: "host" },
    });
    mocks.getHostDeviceById.mockResolvedValue({
      ok: true,
      data: { id: hostDeviceId, serverId },
    });
    mocks.updateServer.mockResolvedValue({ ok: true, data: {} });
    mocks.listActiveAccessTokenHashes.mockResolvedValue(["hash"]);
  });

  it("rejects missing authorization before database writes", async () => {
    await expect(handleHeartbeat(input, null)).resolves.toEqual({
      ok: false,
      error: "unauthorized",
    });
    expect(mocks.touchHostDevice).not.toHaveBeenCalled();
  });

  it("rejects a device bound to a different server", async () => {
    mocks.getHostDeviceById.mockResolvedValue({
      ok: true,
      data: { id: hostDeviceId, serverId: "123e4567-e89b-42d3-a456-426614174003" },
    });
    await expect(handleHeartbeat(input, "token")).resolves.toEqual({
      ok: false,
      error: "device_not_found",
    });
  });

  it("updates status and returns the complete active token set", async () => {
    await expect(handleHeartbeat(input, "token")).resolves.toEqual({
      ok: true,
      data: {
        acknowledged: true,
        nextIntervalMs: 30_000,
        accessTokenHashes: ["hash"],
      },
    });
    expect(mocks.touchHostDevice).toHaveBeenCalledWith(hostDeviceId);
    expect(mocks.updateServer).toHaveBeenCalledWith(serverId, {
      status: "online",
    });
  });
});
