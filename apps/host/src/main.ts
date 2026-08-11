/**
 * Host application — main entry point.
 *
 * Orchestrates the full host lifecycle:
 * 1. Load configuration
 * 2. Collect device info
 * 3. Claim a server on the portal
 * 4. Start the file streaming server
 * 5. Begin heartbeat loop
 * 6. Handle graceful shutdown
 */
import { loadConfig } from "./config";
import { AccessTokenStore } from "./access-token-store";
import { collectDeviceInfo } from "./device-info";
import { createFileServer } from "./file-server";
import { HeartbeatScheduler } from "./heartbeat";
import { ProtocolClient } from "./protocol-client";
import { existsSync, statSync } from "node:fs";
import { HostAgent } from "./agent";
import { loadStoredAgentToken, saveAgentToken } from "./credential-store";
import { PairingClient } from "./pairing-client";
import { portalUrlFromLaunchArguments } from "./launch-url";

let heartbeat: HeartbeatScheduler | null = null;
let fileServer: ReturnType<typeof createFileServer> | null = null;
let protocolClient: ProtocolClient | null = null;
let claimedHostDeviceId: string | null = null;
let shuttingDown = false;
let hostAgent: HostAgent | null = null;

async function main() {
  const launchedPortalUrl = portalUrlFromLaunchArguments(process.argv.slice(2));
  const config = loadConfig(
    launchedPortalUrl ? { portalUrl: launchedPortalUrl } : undefined,
  );

  console.log("[host] Starting LANStream Host...");
  console.log(`[host] Portal: ${config.portalUrl}`);
  console.log(`[host] Media:  ${config.mediaPath}`);

  let agentToken = config.agentToken ?? loadStoredAgentToken(config.portalUrl);
  if (!agentToken && (!config.serverId || !config.accessToken)) {
    console.log(
      "[agent] This host is not paired yet. Opening secure approval...",
    );
    const { port: _port, ...hostDeviceInfo } = collectDeviceInfo(config.port, config.localIp);
    agentToken = await new PairingClient(config.portalUrl).pair({
      requestedName: hostDeviceInfo.hostname,
      hostDeviceInfo,
    });
    saveAgentToken(config.portalUrl, agentToken);
    console.log("[agent] Pairing approved and credential saved securely.");
  }

  if (agentToken) {
    console.log("[agent] Starting paired host agent...");
    hostAgent = new HostAgent(
      config.portalUrl,
      agentToken,
      config.port,
      config.heartbeatIntervalMs,
      config.localIp,
    );
    hostAgent.start();
    console.log("[agent] Waiting for server assignments from the portal.");
    return;
  }

  if (!config.serverId || !config.accessToken) {
    throw new Error("Legacy host mode requires a server ID and access token");
  }
  console.log(`[host] Server: ${config.serverId}`);

  // ── 1. Protocol client ──
  const client = new ProtocolClient({
    portalUrl: config.portalUrl,
    serverId: config.serverId,
    accessToken: config.accessToken,
  });
  protocolClient = client;

  // ── 2. Claim a server ──
  const deviceInfo = collectDeviceInfo(config.port, config.localIp);
  console.log(`[host] Claiming server ${config.serverId}...`);

  const claimResult = await client.claim(deviceInfo);
  if (!claimResult.ok) {
    console.error(
      `[host] Claim failed (${claimResult.status}): ${claimResult.message}`,
    );
    process.exit(1);
  }

  const { hostDeviceId } = claimResult.data;
  claimedHostDeviceId = hostDeviceId;
  const accessTokens = new AccessTokenStore();
  accessTokens.replace(claimResult.data.accessTokenHashes);
  console.log(`[host] Claimed! Device ID: ${hostDeviceId}`);
  console.log(`[host] Portal media path: ${claimResult.data.mediaPath}`);

  // Use portal-provided mediaPath if it differs from config
  const effectiveMediaPath = claimResult.data.mediaPath || config.mediaPath;

  // Validate the media path exists
  if (
    !existsSync(effectiveMediaPath) ||
    !statSync(effectiveMediaPath).isDirectory()
  ) {
    throw new Error(`Media path is not a directory: ${effectiveMediaPath}`);
  }
  console.log(`[host] Effective media path: ${effectiveMediaPath}`);

  // ── 3. File server ──
  fileServer = createFileServer({
    port: config.port,
    mediaPath: effectiveMediaPath,
    allowedOrigin: new URL(config.portalUrl).origin,
    getStatus: () => ({
      hostname: deviceInfo.hostname,
      platform: deviceInfo.platform,
      version: deviceInfo.version,
      serverName: "LANStream Host",
      status: heartbeat?.currentStatus ?? "online",
      uptime: process.uptime(),
    }),
    validateToken: async (token: string) => accessTokens.validate(token),
  });

  await fileServer.start();

  // ── 4. Heartbeat ──
  heartbeat = new HeartbeatScheduler({
    client,
    hostDeviceId,
    port: config.port,
    baseIntervalMs: config.heartbeatIntervalMs,
    onCommand: (commands) => {
      if (!commands) return;
      for (const cmd of commands) {
        handleCommand(cmd.type, cmd.payload);
      }
    },
    onAccessTokensUpdated: (hashes) => accessTokens.replace(hashes),
    onMediaPathUpdated: (newPath) => {
      console.log(`[host] Portal updated media path: ${newPath}`);
      // Note: media path change requires host restart for full effect
      // The file server resolves mediaRoot at creation time
    },
  });

  heartbeat.start();
  console.log(
    `[host] Heartbeat running (every ${config.heartbeatIntervalMs}ms)`,
  );
  console.log("[host] Host is ready!");
}

function handleCommand(type: string, _payload: unknown): void {
  console.log(`[host] Received command: ${type}`);

  switch (type) {
    case "restart":
      console.log("[host] Restarting...");
      process.exit(0); // Process manager should restart
      break;
    case "shutdown":
      console.log("[host] Shutting down...");
      shutdown();
      break;
    default:
      console.warn(`[host] Unknown command: ${type}`);
  }
}

async function shutdown(): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log("[host] Shutting down gracefully...");

  heartbeat?.stop();
  await hostAgent?.stop();

  if (fileServer) {
    await fileServer.stop();
  }

  if (protocolClient && claimedHostDeviceId) {
    const released = await protocolClient.release(claimedHostDeviceId);
    if (!released.ok) {
      console.warn(`[host] Release failed: ${released.message}`);
    }
  }

  process.exit(0);
}

// ── Signal handlers ──
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// ── Start ──
main().catch((err) => {
  console.error("[host] Fatal error:", err);
  process.exit(1);
});
