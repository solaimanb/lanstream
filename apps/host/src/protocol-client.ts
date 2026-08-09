/**
 * Protocol client — communicates with the portal API.
 *
 * Handles claim, heartbeat, and release lifecycle.
 * Retries on transient failures with exponential backoff.
 */
import type {
  ClaimRequest,
  ClaimResponse,
  HeartbeatRequest,
  HeartbeatResponse,
  HostDeviceInfo,
  ReleaseResponse,
  ServerStatus,
} from "@lanstream/protocol";

interface ProtocolClientOptions {
  portalUrl: string;
  serverId: string;
  /** Access token obtained during claim. Used for auth on streaming endpoints. */
  accessToken?: string;
}

type RequestResult<T> =
  { ok: true; data: T } | { ok: false; status: number; message: string };

export class ProtocolClient {
  private readonly portalUrl: string;
  private readonly serverId: string;
  private accessToken: string | undefined;

  constructor(options: ProtocolClientOptions) {
    this.portalUrl = options.portalUrl.replace(/\/$/, "");
    this.serverId = options.serverId;
    this.accessToken = options.accessToken;
  }

  /** Set or update the access token. */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /** POST /api/runtime/claim — register this host with the portal. */
  async claim(
    hostDeviceInfo: HostDeviceInfo,
  ): Promise<RequestResult<ClaimResponse>> {
    const body: ClaimRequest = {
      serverId: this.serverId,
      hostDeviceInfo,
    };

    return this.post<ClaimResponse>("/api/runtime/claim", body);
  }

  /** POST /api/runtime/heartbeat — send periodic status update. */
  async heartbeat(
    hostDeviceId: string,
    status: ServerStatus,
    hostDeviceInfo?: HostDeviceInfo,
  ): Promise<RequestResult<HeartbeatResponse>> {
    const body: HeartbeatRequest = {
      serverId: this.serverId,
      hostDeviceId,
      status,
      hostDeviceInfo,
    };

    return this.post<HeartbeatResponse>("/api/runtime/heartbeat", body);
  }

  /** POST /api/runtime/release — unregister this host. */
  async release(hostDeviceId: string): Promise<RequestResult<ReleaseResponse>> {
    return this.post<ReleaseResponse>("/api/runtime/release", {
      serverId: this.serverId,
      hostDeviceId,
    });
  }

  /** Generic POST request with retry logic. */
  private async post<T>(
    path: string,
    body: unknown,
    retries = 3,
  ): Promise<RequestResult<T>> {
    const url = `${this.portalUrl}${path}`;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (this.accessToken) {
          headers["Authorization"] = `Bearer ${this.accessToken}`;
        }

        const res = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(10_000),
        });

        if (res.ok) {
          const payload = (await res.json().catch(() => null)) as unknown;
          if (
            !payload ||
            typeof payload !== "object" ||
            !("data" in payload)
          ) {
            return {
              ok: false,
              status: res.status,
              message: "Invalid API response",
            };
          }
          return { ok: true, data: (payload as { data: T }).data };
        }

        const errorBody = (await res.json().catch(() => null)) as {
          error?: { message?: string } | string;
        } | null;
        const errorMessage =
          typeof errorBody?.error === "string"
            ? errorBody.error
            : errorBody?.error?.message;
        return {
          ok: false,
          status: res.status,
          message: errorMessage ?? `HTTP ${res.status}`,
        };
      } catch (err) {
        if (attempt < retries - 1) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        return {
          ok: false,
          status: 0,
          message: err instanceof Error ? err.message : "Network error",
        };
      }
    }

    // Unreachable but TypeScript needs it
    return { ok: false, status: 0, message: "Max retries exceeded" };
  }
}
