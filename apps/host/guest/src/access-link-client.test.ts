import { describe, expect, it, vi } from "vitest";
import { loadMediaFiles } from "./access-link-client";

const response = (status: number, data?: unknown) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  }) as Response;

describe("loadMediaFiles", () => {
  it("retries while a new access link synchronizes to the host", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response(401))
      .mockResolvedValueOnce(
        response(200, {
          data: [{ path: "movie.mp4", size: 12, mimeType: "video/mp4" }],
        }),
      );
    const wait = vi.fn(async () => undefined);

    await expect(
      loadMediaFiles("new-token", {
        signal: new AbortController().signal,
        fetcher,
        wait,
      }),
    ).resolves.toEqual([
      { path: "movie.mp4", size: 12, mimeType: "video/mp4" },
    ]);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(wait).toHaveBeenCalledWith(1_000, expect.any(AbortSignal));
  });

  it("reports an invalid link after the synchronization window", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response(401));

    await expect(
      loadMediaFiles("bad-token", {
        signal: new AbortController().signal,
        fetcher,
        retryCount: 2,
        wait: async () => undefined,
      }),
    ).rejects.toThrow("This link is invalid or expired.");
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it("does not retry unrelated host errors", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response(500));

    await expect(
      loadMediaFiles("token", {
        signal: new AbortController().signal,
        fetcher,
      }),
    ).rejects.toThrow("Unable to load media.");
    expect(fetcher).toHaveBeenCalledOnce();
  });
});
