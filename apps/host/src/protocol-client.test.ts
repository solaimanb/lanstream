import { afterEach, describe, expect, it, vi } from "vitest";
import { ProtocolClient } from "./protocol-client";

const serverId = "00000000-0000-0000-0000-000000000001";
const deviceInfo = {
  hostname: "host",
  platform: "linux/x64",
  version: "1.0.0",
  localIp: "192.168.1.2",
  port: 4780,
};

afterEach(() => vi.unstubAllGlobals());

describe("ProtocolClient", () => {
  it("sends bearer authorization and unwraps API envelopes", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        data: {
          hostDeviceId: "00000000-0000-0000-0000-000000000002",
          serverId,
          accessTokenHashes: ["hash"],
        },
        error: null,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const client = new ProtocolClient({
      portalUrl: "https://portal.example.com/",
      serverId,
      accessToken: "claim-token",
    });

    const result = await client.claim(deviceInfo);
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://portal.example.com/api/runtime/claim",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer claim-token",
        }),
      }),
    );
  });

  it("reports malformed success payloads instead of returning undefined data", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ ok: true })));
    const client = new ProtocolClient({
      portalUrl: "https://portal.example.com",
      serverId,
      accessToken: "claim-token",
    });

    await expect(client.claim(deviceInfo)).resolves.toEqual({
      ok: false,
      status: 200,
      message: "Invalid API response",
    });
  });

  it("preserves structured API error messages", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          { data: null, error: { code: "token_invalid", message: "token_invalid" } },
          { status: 403 },
        ),
      ),
    );
    const client = new ProtocolClient({
      portalUrl: "https://portal.example.com",
      serverId,
      accessToken: "bad-token",
    });

    await expect(client.claim(deviceInfo)).resolves.toEqual({
      ok: false,
      status: 403,
      message: "token_invalid",
    });
  });
});
