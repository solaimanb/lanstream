import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFileServer } from "./file-server";

const allowedOrigin = "https://portal.example.com";
let tempRoot: string;
let mediaPath: string;
let guestAssetsPath: string;
let fileServer: ReturnType<typeof createFileServer>;
let baseUrl: string;

beforeEach(async () => {
  tempRoot = mkdtempSync(join(tmpdir(), "lanstream-host-"));
  mediaPath = join(tempRoot, "media");
  guestAssetsPath = join(tempRoot, "guest");
  mkdirSync(mediaPath);
  mkdirSync(join(guestAssetsPath, "assets"), { recursive: true });
  writeFileSync(join(mediaPath, "movie.txt"), "0123456789");
  writeFileSync(join(tempRoot, "secret.txt"), "secret");
  writeFileSync(
    join(guestAssetsPath, "index.html"),
    '<div id="root"></div><script type="module" src="/guest-assets/assets/app.js"></script>',
  );
  writeFileSync(join(guestAssetsPath, "assets", "app.js"), "export {};");

  fileServer = createFileServer({
    port: 0,
    mediaPath,
    guestAssetsPath,
    allowedOrigin,
    validateToken: async (token) => token === "valid-token",
    getStatus: () => ({
      hostname: "test-host",
      platform: "test",
      version: "1.0.0",
      serverName: "Test Host",
      status: "online",
      uptime: 1,
    }),
  });
  await fileServer.start();
  const address = fileServer.server.address();
  if (!address || typeof address === "string") throw new Error("No test port");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterEach(async () => {
  await fileServer.stop();
  rmSync(tempRoot, { recursive: true, force: true });
});

describe("file server", () => {
  it("serves status with CORS only for the configured portal", async () => {
    const response = await fetch(`${baseUrl}/status`, {
      headers: { Origin: allowedOrigin },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBe(
      allowedOrigin,
    );
    await expect(response.json()).resolves.toMatchObject({
      hostname: "test-host",
      status: "online",
    });
  });

  it("serves the same-origin guest app with a restrictive CSP", async () => {
    const response = await fetch(`${baseUrl}/watch#token=valid-token`);
    expect(response.status).toBe(200);
    const policy = response.headers.get("content-security-policy");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("script-src 'self'");
    expect(policy).not.toContain("'unsafe-inline'");
    expect(await response.text()).toContain("/guest-assets/assets/app.js");

    const asset = await fetch(`${baseUrl}/guest-assets/assets/app.js`);
    expect(asset.status).toBe(200);
    expect(asset.headers.get("content-type")).toContain("text/javascript");
    await expect(asset.text()).resolves.toBe("export {};");
  });

  it("does not serve files outside the guest asset root", async () => {
    const response = await fetch(`${baseUrl}/guest-assets/%2e%2e%2fsecret.txt`);
    expect(response.status).toBe(404);
  });

  it("requires a valid bearer token for streams", async () => {
    expect((await fetch(`${baseUrl}/stream/invalid/movie.txt`)).status).toBe(
      401,
    );
    expect(
      (await fetch(`${baseUrl}/stream/another-invalid/movie.txt`)).status,
    ).toBe(401);
  });

  it("serves complete files and valid byte ranges", async () => {
    const complete = await fetch(`${baseUrl}/stream/valid-token/movie.txt`);
    expect(complete.status).toBe(200);
    await expect(complete.text()).resolves.toBe("0123456789");

    const partial = await fetch(`${baseUrl}/stream/valid-token/movie.txt`, {
      headers: { Range: "bytes=2-5" },
    });
    expect(partial.status).toBe(206);
    expect(partial.headers.get("content-range")).toBe("bytes 2-5/10");
    await expect(partial.text()).resolves.toBe("2345");
  });

  it("rejects invalid ranges and traversal outside the media root", async () => {
    const range = await fetch(`${baseUrl}/stream/valid-token/movie.txt`, {
      headers: { Range: "bytes=100-200" },
    });
    expect(range.status).toBe(416);

    const traversal = await fetch(
      `${baseUrl}/stream/valid-token/%2e%2e%2fsecret.txt`,
    );
    expect(traversal.status).toBe(404);
  });

  it("lists media files only for valid tokens", async () => {
    expect((await fetch(`${baseUrl}/files/invalid`)).status).toBe(401);
    const response = await fetch(`${baseUrl}/files/valid-token`);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: [{ path: "movie.txt", size: 10, mimeType: "text/plain" }],
    });
  });
});
