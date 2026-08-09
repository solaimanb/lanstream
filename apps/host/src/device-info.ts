/**
 * Device info — collects local host device information.
 *
 * Uses Node.js built-in modules to detect hostname, platform, and network IP.
 */
import type { HostDeviceInfo } from "@lanstream/protocol";
import { hostname, networkInterfaces } from "node:os";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Read version from package.json at startup. */
function getVersion(): string {
  try {
    const pkg = JSON.parse(
      readFileSync(resolve(import.meta.dirname, "../package.json"), "utf-8"),
    );
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

/** Get the local LAN IP address. */
function getLocalIp(): string {
  const interfaces = networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] ?? []) {
      // Skip internal and non-IPv4 interfaces
      if (!iface.internal && iface.family === "IPv4") {
        return iface.address;
      }
    }
  }
  return "127.0.0.1";
}

/** Detect the platform identifier. */
function getPlatform(): string {
  const platform = process.platform;
  const arch = process.arch;
  return `${platform}/${arch}`;
}

/** Collect host device information. */
export function collectDeviceInfo(port: number): HostDeviceInfo {
  return {
    hostname: hostname(),
    platform: getPlatform(),
    version: getVersion(),
    localIp: getLocalIp(),
    port,
  };
}
