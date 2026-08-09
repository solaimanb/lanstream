import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleClaim } from "./claim";

const mocks = vi.hoisted(() => ({
  validateAccessToken: vi.fn(),
  listActiveAccessTokenHashes: vi.fn(),
  createAuditEvent: vi.fn(),
  upsertHostDevice: vi.fn(),
  updateServer: vi.fn(),
  getServerById: vi.fn(),
}));

vi.mock("@/server/dal/access-links", () => ({
  validateAccessToken: mocks.validateAccessToken,
  listActiveAccessTokenHashes: mocks.listActiveAccessTokenHashes,
}));
vi.mock("@/server/dal/audit-events", () => ({
  createAuditEvent: mocks.createAuditEvent,
}));
vi.mock("@/server/dal/host-devices", () => ({
  upsertHostDevice: mocks.upsertHostDevice,
}));
vi.mock("@/server/dal/servers", () => ({
  updateServer: mocks.updateServer,
  getServerById: mocks.getServerById,
}));

const serverId = "123e4567-e89b-42d3-a456-426614174001";
const input = {
  serverId,
  hostDeviceInfo: {
    hostname: "host",
    platform: "win32/x64",
    version: "0.1.0",
    localIp: "192.168.1.10",
    port: 4780,
  },
};

describe("handleClaim", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.upsertHostDevice.mockResolvedValue({ id: "host-device-id" });
    mocks.listActiveAccessTokenHashes.mockResolvedValue(["active-hash"]);
  });

  it("rejects a missing access token before writing", async () => {
    await expect(handleClaim(input, null)).resolves.toEqual({
      ok: false,
      error: "unauthorized",
    });
    expect(mocks.upsertHostDevice).not.toHaveBeenCalled();
  });

  it("distinguishes expired tokens from unknown tokens", async () => {
    mocks.validateAccessToken.mockResolvedValueOnce({
      ok: false,
      error: "expired",
    });
    await expect(handleClaim(input, "expired")).resolves.toEqual({
      ok: false,
      error: "token_expired",
    });

    mocks.validateAccessToken.mockResolvedValueOnce({
      ok: false,
      error: "not_found",
    });
    await expect(handleClaim(input, "unknown")).resolves.toEqual({
      ok: false,
      error: "token_invalid",
    });
  });

  it("rejects a token belonging to another server", async () => {
    mocks.validateAccessToken.mockResolvedValue({
      ok: true,
      data: { serverId: "123e4567-e89b-42d3-a456-426614174002" },
    });

    await expect(handleClaim(input, "wrong-server")).resolves.toEqual({
      ok: false,
      error: "token_invalid",
    });
    expect(mocks.upsertHostDevice).not.toHaveBeenCalled();
  });

  it("rejects guest tokens for host control", async () => {
    mocks.validateAccessToken.mockResolvedValue({
      ok: true,
      data: { serverId, purpose: "guest" },
    });

    await expect(handleClaim(input, "guest-token")).resolves.toEqual({
      ok: false,
      error: "token_invalid",
    });
    expect(mocks.upsertHostDevice).not.toHaveBeenCalled();
  });

  it("claims the server after validating its token", async () => {
    mocks.validateAccessToken.mockResolvedValue({
      ok: true,
      data: { serverId, purpose: "host" },
    });
    mocks.getServerById.mockResolvedValue({
      ok: true,
      data: { mediaPath: "/home/user/Movies" },
    });

    await expect(handleClaim(input, "valid-token")).resolves.toEqual({
      ok: true,
      data: {
        hostDeviceId: "host-device-id",
        serverId,
        mediaPath: "/home/user/Movies",
        accessTokenHashes: ["active-hash"],
      },
    });
    expect(mocks.upsertHostDevice).toHaveBeenCalledOnce();
    expect(mocks.updateServer).toHaveBeenCalledWith(serverId, {
      status: "starting",
    });
    expect(mocks.createAuditEvent).toHaveBeenCalledOnce();
  });
});
