/** Local HTTP server for status and authenticated media streaming. */
import type { HostStatusResponse, MediaFile } from "@lanstream/protocol";
import {
  createReadStream,
  existsSync,
  readFileSync,
  readdirSync,
  realpathSync,
  statSync,
} from "node:fs";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

interface FileServerOptions {
  port: number;
  mediaPath: string;
  allowedOrigin: string;
  guestAssetsPath?: string;
  validateToken: (token: string) => Promise<boolean>;
  getStatus: () => HostStatusResponse;
}

const MIME_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mkv": "video/x-matroska",
  ".avi": "video/x-msvideo",
  ".mov": "video/quicktime",
  ".mp3": "audio/mpeg",
  ".flac": "audio/flac",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".json": "application/json",
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".map": "application/json",
  ".svg": "image/svg+xml",
};

function getMimeType(filePath: string): string {
  return (
    MIME_TYPES[extname(filePath).toLowerCase()] ?? "application/octet-stream"
  );
}

function extractBearerToken(req: IncomingMessage): string | null {
  const match = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization ?? "");
  return match?.[1] ?? null;
}

function commonHeaders(origin?: string): Record<string, string> {
  return {
    ...(origin
      ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" }
      : {}),
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  };
}

function sendJson(
  res: ServerResponse,
  status: number,
  body: unknown,
  origin?: string,
): void {
  res.writeHead(status, {
    ...commonHeaders(origin),
    "Content-Type": "application/json",
  });
  res.end(JSON.stringify(body));
}

function send401(res: ServerResponse, origin?: string): void {
  sendJson(
    res,
    401,
    { error: { code: "unauthorized", message: "Valid access token required" } },
    origin,
  );
}

function send404(res: ServerResponse, origin?: string): void {
  sendJson(
    res,
    404,
    { error: { code: "not_found", message: "File not found" } },
    origin,
  );
}

function isWithin(basePath: string, candidatePath: string): boolean {
  const pathFromBase = relative(basePath, candidatePath);
  return (
    pathFromBase === "" ||
    (!pathFromBase.startsWith(`..${sep}`) &&
      pathFromBase !== ".." &&
      !isAbsolute(pathFromBase))
  );
}

function parseRange(
  header: string,
  fileSize: number,
): { start: number; end: number } | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;

  let start: number;
  let end: number;
  if (match[1]) {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : fileSize - 1;
  } else if (match[2]) {
    const suffixLength = Number(match[2]);
    if (suffixLength <= 0) return null;
    start = Math.max(fileSize - suffixLength, 0);
    end = fileSize - 1;
  } else {
    return null;
  }

  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start < 0 ||
    end < start ||
    start >= fileSize
  ) {
    return null;
  }
  return { start, end: Math.min(end, fileSize - 1) };
}

function listMediaFiles(mediaRoot: string, limit = 2_000): MediaFile[] {
  const files: MediaFile[] = [];
  const visit = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (files.length >= limit || entry.isSymbolicLink()) return;
      const fullPath = join(directory, entry.name);
      if (entry.isDirectory()) visit(fullPath);
      else if (entry.isFile()) {
        files.push({
          path: relative(mediaRoot, fullPath).split(sep).join("/"),
          size: statSync(fullPath).size,
          mimeType: getMimeType(fullPath),
        });
      }
    }
  };
  visit(mediaRoot);
  return files;
}

function sendGuestPage(res: ServerResponse, guestRoot: string): void {
  const indexPath = resolve(guestRoot, "index.html");
  if (!existsSync(indexPath)) {
    return sendJson(res, 500, {
      error: {
        code: "guest_app_missing",
        message: "Guest application assets are not installed",
      },
    });
  }

  res.writeHead(200, {
    ...commonHeaders(),
    "Cache-Control": "no-store",
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; media-src 'self'; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    "Content-Type": "text/html; charset=utf-8",
  });
  res.end(readFileSync(indexPath));
}

function sendGuestAsset(
  res: ServerResponse,
  guestRoot: string,
  encodedPath: string,
): void {
  let requestedPath: string;
  try {
    requestedPath = decodeURIComponent(encodedPath);
  } catch {
    return send404(res);
  }

  const assetPath = resolve(guestRoot, requestedPath);
  if (!isWithin(guestRoot, assetPath) || !existsSync(assetPath)) {
    return send404(res);
  }

  const realGuestRoot = realpathSync(guestRoot);
  const realAssetPath = realpathSync(assetPath);
  if (
    !isWithin(realGuestRoot, realAssetPath) ||
    !statSync(realAssetPath).isFile()
  ) {
    return send404(res);
  }

  res.writeHead(200, {
    ...commonHeaders(),
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Type": getMimeType(realAssetPath),
  });
  createReadStream(realAssetPath).pipe(res);
}

function decodePathToken(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (
    parts.length !== 4 ||
    parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)
  ) {
    return false;
  }
  // 10.0.0.0/8
  if (parts[0] === 10) return true;
  // 172.16.0.0/12
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  // 192.168.0.0/16
  if (parts[0] === 192 && parts[1] === 168) return true;
  // 127.0.0.0/8 (loopback)
  if (parts[0] === 127) return true;
  // 169.254.0.0/16 (link-local)
  if (parts[0] === 169 && parts[1] === 254) return true;
  return false;
}

function isPrivateIp(ip: string): boolean {
  // IPv4
  if (ip.includes(".")) return isPrivateIPv4(ip);
  // IPv6 loopback ::1 or ::ffff:127.x.x.x
  if (ip === "::1" || ip === "::ffff:127.0.0.1") return true;
  // IPv6 link-local fe80::/10
  if (ip.startsWith("fe80") || ip.startsWith("::ffff:169.254")) return true;
  // IPv6 private fc00::/7 (unique local)
  if (ip.startsWith("fc") || ip.startsWith("fd")) return true;
  return false;
}

function extractClientIp(req: IncomingMessage): string | null {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string") return realIp;
  const socket = req.socket;
  if (socket && typeof socket.remoteAddress === "string") {
    // Normalize IPv6-mapped IPv4 (::ffff:192.168.1.1 → 192.168.1.1)
    return socket.remoteAddress.replace(/^::ffff:/, "");
  }
  return null;
}

function send403(res: ServerResponse, origin?: string): void {
  sendJson(
    res,
    403,
    {
      error: {
        code: "forbidden",
        message: "Access denied: not on local network",
      },
    },
    origin,
  );
}

export function createFileServer(options: FileServerOptions) {
  const { port, mediaPath, validateToken, getStatus, allowedOrigin } = options;
  const mediaRoot = resolve(mediaPath);
  const guestRoot = resolve(
    options.guestAssetsPath ??
      fileURLToPath(new URL("./guest", import.meta.url)),
  );

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", `http://localhost:${port}`);
      const requestOrigin = req.headers.origin;
      const responseOrigin =
        requestOrigin === allowedOrigin ? requestOrigin : undefined;

      // ── LAN-only enforcement: reject non-private IPs ──
      const clientIp = extractClientIp(req);
      if (clientIp && !isPrivateIp(clientIp)) {
        return send403(res, responseOrigin);
      }

      if (req.method === "OPTIONS") {
        if (requestOrigin !== allowedOrigin) {
          return sendJson(res, 403, { error: { code: "forbidden" } });
        }
        res.writeHead(204, {
          ...commonHeaders(responseOrigin),
          "Access-Control-Allow-Headers": "Authorization, Content-Type",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Max-Age": "86400",
        });
        return res.end();
      }

      if (req.method === "GET" && url.pathname === "/watch") {
        return sendGuestPage(res, guestRoot);
      }

      if (req.method === "GET" && url.pathname.startsWith("/guest-assets/")) {
        return sendGuestAsset(
          res,
          guestRoot,
          url.pathname.slice("/guest-assets/".length),
        );
      }

      if (req.method === "GET" && url.pathname === "/status") {
        return sendJson(res, 200, getStatus(), responseOrigin);
      }

      if (req.method === "GET" && url.pathname.startsWith("/files/")) {
        const token =
          decodePathToken(url.pathname.slice("/files/".length)) ??
          extractBearerToken(req);
        if (!token || !(await validateToken(token))) {
          return send401(res, responseOrigin);
        }
        return sendJson(
          res,
          200,
          { data: listMediaFiles(realpathSync(mediaRoot)), error: null },
          responseOrigin,
        );
      }

      if (req.method === "GET" && url.pathname.startsWith("/stream/")) {
        const streamRequest = url.pathname.slice("/stream/".length);
        const separatorIndex = streamRequest.indexOf("/");
        if (separatorIndex < 1) return send404(res, responseOrigin);
        const token = decodePathToken(streamRequest.slice(0, separatorIndex));
        if (!token || !(await validateToken(token))) {
          return send401(res, responseOrigin);
        }

        let requestedPath: string;
        try {
          requestedPath = decodeURIComponent(
            streamRequest.slice(separatorIndex + 1),
          );
        } catch {
          return send404(res, responseOrigin);
        }

        const filePath = resolve(mediaRoot, requestedPath);
        if (!isWithin(mediaRoot, filePath) || !existsSync(filePath)) {
          return send404(res, responseOrigin);
        }

        const realMediaRoot = realpathSync(mediaRoot);
        const realFilePath = realpathSync(filePath);
        if (!isWithin(realMediaRoot, realFilePath)) {
          return send404(res, responseOrigin);
        }

        const stat = statSync(realFilePath);
        if (!stat.isFile()) return send404(res, responseOrigin);

        const rangeHeader = req.headers.range;
        if (rangeHeader) {
          const range = parseRange(rangeHeader, stat.size);
          if (!range) {
            res.writeHead(416, {
              ...commonHeaders(responseOrigin),
              "Content-Range": `bytes */${stat.size}`,
            });
            return res.end();
          }

          const chunkSize = range.end - range.start + 1;
          res.writeHead(206, {
            ...commonHeaders(responseOrigin),
            "Content-Range": `bytes ${range.start}-${range.end}/${stat.size}`,
            "Accept-Ranges": "bytes",
            "Content-Length": chunkSize,
            "Content-Type": getMimeType(realFilePath),
          });
          createReadStream(realFilePath, range).pipe(res);
          return;
        }

        res.writeHead(200, {
          ...commonHeaders(responseOrigin),
          "Content-Length": stat.size,
          "Content-Type": getMimeType(realFilePath),
          "Accept-Ranges": "bytes",
        });
        createReadStream(realFilePath).pipe(res);
        return;
      }

      send404(res, responseOrigin);
    } catch (error) {
      console.error("[host] File server request failed:", error);
      if (!res.headersSent) {
        sendJson(res, 500, {
          error: { code: "internal_error", message: "Request failed" },
        });
      } else {
        res.destroy();
      }
    }
  });

  return {
    start(): Promise<void> {
      return new Promise((resolveStart, rejectStart) => {
        server.once("error", rejectStart);
        server.listen(port, () => {
          server.off("error", rejectStart);
          console.log(`[host] File server listening on port ${port}`);
          resolveStart();
        });
      });
    },
    stop(): Promise<void> {
      return new Promise((resolveStop, rejectStop) => {
        if (!server.listening) return resolveStop();
        server.close((error) => (error ? rejectStop(error) : resolveStop()));
      });
    },
    server,
  };
}
