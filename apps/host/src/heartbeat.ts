/**
 * Heartbeat scheduler — periodic status reporting to the portal.
 *
 * Manages the heartbeat loop with adaptive interval.
 * Handles graceful shutdown and command dispatching.
 */
import type { HeartbeatResponse, ServerStatus } from "@lanstream/protocol";
import { collectDeviceInfo } from "./device-info";
import type { ProtocolClient } from "./protocol-client";

interface HeartbeatSchedulerOptions {
  client: ProtocolClient;
  hostDeviceId: string;
  port: number;
  baseIntervalMs: number;
  /** Called when the portal sends a command. */
  onCommand?: (command: HeartbeatResponse["commands"]) => void;
  /** Called with the complete active guest-token hash set. */
  onAccessTokensUpdated?: (hashes: string[]) => void;
  /** Called when the portal updates the media path. */
  onMediaPathUpdated?: (mediaPath: string) => void;
}

export class HeartbeatScheduler {
  private readonly client: ProtocolClient;
  private readonly hostDeviceId: string;
  private readonly port: number;
  private baseIntervalMs: number;
  private currentIntervalMs: number;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private running = false;
  private status: ServerStatus = "online";
  private onCommand?: (
    commands: NonNullable<HeartbeatResponse["commands"]>,
  ) => void;

  /** Current status of the host. */
  get currentStatus(): ServerStatus {
    return this.status;
  }
  private onAccessTokensUpdated?: (hashes: string[]) => void;
  private onMediaPathUpdated?: (mediaPath: string) => void;

  constructor(options: HeartbeatSchedulerOptions) {
    this.client = options.client;
    this.hostDeviceId = options.hostDeviceId;
    this.port = options.port;
    this.baseIntervalMs = options.baseIntervalMs;
    this.currentIntervalMs = options.baseIntervalMs;
    this.onCommand = options.onCommand;
    this.onAccessTokensUpdated = options.onAccessTokensUpdated;
    this.onMediaPathUpdated = options.onMediaPathUpdated;
  }

  /** Set the current server status (e.g., 'stopping'). */
  setStatus(status: ServerStatus): void {
    this.status = status;
  }

  /** Start the heartbeat loop. */
  start(): void {
    if (this.running) return;
    this.running = true;
    void this.sendHeartbeat();
  }

  /** Stop the heartbeat loop. */
  stop(): void {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private async sendHeartbeat(): Promise<void> {
    try {
      const deviceInfo = collectDeviceInfo(this.port);
      const result = await this.client.heartbeat(
        this.hostDeviceId,
        this.status,
        deviceInfo,
      );

      if (result.ok) {
        // Adapt interval from portal's recommendation
        if (result.data.nextIntervalMs > 0) {
          this.currentIntervalMs = result.data.nextIntervalMs;
        }

        // Dispatch commands
        if (result.data.commands?.length && this.onCommand) {
          this.onCommand(result.data.commands);
        }

        this.onAccessTokensUpdated?.(result.data.accessTokenHashes);

        // Handle media path updates from portal
        if (result.data.mediaPath) {
          this.onMediaPathUpdated?.(result.data.mediaPath);
        }
      } else {
        console.warn(`[host] Heartbeat failed: ${result.message}`);
      }
    } catch (err) {
      console.error("[host] Heartbeat error:", err);
    } finally {
      if (this.running) {
        this.timer = setTimeout(() => {
          void this.sendHeartbeat();
        }, this.currentIntervalMs);
      }
    }
  }
}
