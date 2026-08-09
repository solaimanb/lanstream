import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleRelease } from "./release";

const mocks = vi.hoisted(() => ({
  validateAccessToken: vi.fn(),
  createAuditEvent: vi.fn(),
  deleteHostDevice: vi.fn(),
  getHostDeviceById: vi.fn(),
  updateServer: vi.fn(),
}));

vi.mock("@/server/dal/access-links", () => ({
  validateAccessToken: mocks.validateAccessToken,
}));
vi.mock("@/server/dal/audit-events", () => ({
  createAuditEvent: mocks.createAuditEvent,
}));
vi.mock("@/server/dal/host-devices", () => ({
  deleteHostDevice: mocks.deleteHostDevice,
  getHostDeviceById: mocks.getHostDeviceById,
}));
vi.mock("@/server/dal/servers", () => ({
  updateServer: mocks.updateServer,
}));

const serverId = "123e4567-e89b-42d3-a456-426614174001";
const hostDeviceId = "123e4567-e89b-42d3-a456-426614174002";
const input = { serverId, hostDeviceId };

describe("handleRelease", () => {
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
    mocks.deleteHostDevice.mockResolvedValue({ ok: true, data: undefined });
    mocks.updateServer.mockResolvedValue({ ok: true, data: {} });
  });

  it("requires authorization", async () => {
    await expect(handleRelease(input, null)).resolves.toEqual({
      ok: false,
      error: "unauthorized",
    });
    expect(mocks.deleteHostDevice).not.toHaveBeenCalled();
  });

  it("does not release a device belonging to another server", async () => {
    mocks.getHostDeviceById.mockResolvedValue({
      ok: true,
      data: { id: hostDeviceId, serverId: "123e4567-e89b-42d3-a456-426614174003" },
    });
    await expect(handleRelease(input, "token")).resolves.toEqual({
      ok: false,
      error: "not_found",
    });
  });

  it("deletes the bound device and marks its server offline", async () => {
    await expect(handleRelease(input, "token")).resolves.toEqual({
      ok: true,
      data: undefined,
    });
    expect(mocks.deleteHostDevice).toHaveBeenCalledWith(hostDeviceId);
    expect(mocks.updateServer).toHaveBeenCalledWith(serverId, {
      status: "offline",
    });
  });
});
