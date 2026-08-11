import type {
  AgentServerAssignment,
  AgentServerReport,
} from "@lanstream/protocol";
import { existsSync, statSync } from "node:fs";
import { AccessTokenStore } from "./access-token-store";
import { AgentClient, AgentRequestError } from "./agent-client";
import { collectDeviceInfo } from "./device-info";
import { createFileServer } from "./file-server";

interface Runtime {
  assignment: AgentServerAssignment;
  tokens: AccessTokenStore;
  fileServer: ReturnType<typeof createFileServer> | null;
  status: AgentServerReport["status"];
  error?: string;
}

export class HostAgent {
  private readonly client: AgentClient;
  private readonly runtimes = new Map<string, Runtime>();
  private running = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly portalUrl: string,
    token: string,
    private readonly basePort: number,
    private readonly fallbackIntervalMs: number,
    private readonly localIp?: string,
  ) {
    this.client = new AgentClient(portalUrl, token);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    void this.tick();
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.timer) clearTimeout(this.timer);
    await Promise.all(
      [...this.runtimes.values()].map((runtime) => runtime.fileServer?.stop()),
    );
    this.runtimes.clear();
  }

  private reports(): AgentServerReport[] {
    return [...this.runtimes.values()].map((runtime) => ({
      serverId: runtime.assignment.serverId,
      status: runtime.status,
      port: runtime.assignment.port,
      error: runtime.error,
    }));
  }

  private async tick(): Promise<void> {
    let nextInterval = this.fallbackIntervalMs;
    try {
      const { port: _port, ...hostDeviceInfo } = collectDeviceInfo(
        this.basePort,
        this.localIp,
      );
      const response = await this.client.heartbeat({
        hostDeviceInfo,
        servers: this.reports(),
      });
      nextInterval = response.nextIntervalMs;
      const changed = await this.reconcile(response.assignments);
      if (changed) nextInterval = 250;
    } catch (error) {
      console.error("[agent] Control-plane heartbeat failed:", error);
      if (error instanceof AgentRequestError && error.status === 401) {
        console.error("[agent] Credential revoked; stopping all listeners.");
        await this.stop();
      }
    } finally {
      if (this.running) {
        this.timer = setTimeout(() => void this.tick(), nextInterval);
      }
    }
  }

  private async reconcile(
    assignments: AgentServerAssignment[],
  ): Promise<boolean> {
    let changed = false;
    const desiredIds = new Set(assignments.map((item) => item.serverId));
    for (const [serverId, runtime] of this.runtimes) {
      if (!desiredIds.has(serverId)) {
        await runtime.fileServer?.stop();
        this.runtimes.delete(serverId);
        changed = true;
      }
    }

    for (const assignment of assignments) {
      const current = this.runtimes.get(assignment.serverId);
      if (assignment.desiredState === "stopped") {
        await current?.fileServer?.stop();
        this.runtimes.delete(assignment.serverId);
        changed = !!current || changed;
        continue;
      }
      if (
        current &&
        current.fileServer &&
        current.assignment.mediaPath === assignment.mediaPath &&
        current.assignment.port === assignment.port
      ) {
        current.assignment = assignment;
        current.tokens.replace(assignment.accessTokenHashes);
        continue;
      }
      await current?.fileServer?.stop();
      changed = (await this.startRuntime(assignment)) || changed;
    }
    return changed;
  }

  private async startRuntime(
    assignment: AgentServerAssignment,
  ): Promise<boolean> {
    const tokens = new AccessTokenStore();
    tokens.replace(assignment.accessTokenHashes);
    const runtime: Runtime = {
      assignment,
      tokens,
      fileServer: null,
      status: "starting",
    };
    this.runtimes.set(assignment.serverId, runtime);

    try {
      if (
        !existsSync(assignment.mediaPath) ||
        !statSync(assignment.mediaPath).isDirectory()
      ) {
        throw new Error(
          `Media path is not a directory: ${assignment.mediaPath}`,
        );
      }
      const fileServer = createFileServer({
        port: assignment.port,
        mediaPath: assignment.mediaPath,
        allowedOrigin: new URL(this.portalUrl).origin,
        validateToken: async (token) => tokens.validate(token),
        getStatus: () => ({
          hostname: collectDeviceInfo(assignment.port).hostname,
          platform: process.platform,
          version: "0.1.0",
          serverName: assignment.name,
          status: runtime.status,
          uptime: process.uptime(),
        }),
      });
      await fileServer.start();
      runtime.fileServer = fileServer;
      runtime.status = "online";
      console.log(
        `[agent] ${assignment.name} online on port ${assignment.port}`,
      );
      return true;
    } catch (error) {
      runtime.status = "offline";
      runtime.error = error instanceof Error ? error.message : "Start failed";
      console.error(`[agent] Could not start ${assignment.name}:`, error);
      return false;
    }
  }
}
