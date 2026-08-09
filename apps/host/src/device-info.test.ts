/**
 * Unit tests — host device info collection.
 */
import { describe, expect, it } from "vitest";
import { collectDeviceInfo } from "./device-info";

describe("collectDeviceInfo()", () => {
  it("returns valid HostDeviceInfo", () => {
    const info = collectDeviceInfo(4780);

    expect(info).toHaveProperty("hostname");
    expect(info).toHaveProperty("platform");
    expect(info).toHaveProperty("version");
    expect(info).toHaveProperty("localIp");
    expect(info).toHaveProperty("port");

    expect(typeof info.hostname).toBe("string");
    expect(info.hostname.length).toBeGreaterThan(0);

    expect(typeof info.platform).toBe("string");
    expect(info.platform).toMatch(/^\w+\/\w+$/);

    expect(typeof info.version).toBe("string");
    expect(info.version).toMatch(/^\d+\.\d+\.\d+$/);

    expect(typeof info.localIp).toBe("string");
    expect(info.localIp).toMatch(/^\d+\.\d+\.\d+\.\d+$/);

    expect(info.port).toBe(4780);
  });

  it("uses the provided port", () => {
    const info = collectDeviceInfo(8080);
    expect(info.port).toBe(8080);
  });
});
