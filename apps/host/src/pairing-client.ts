import type {
  AgentPairingPollResponse,
  AgentPairingStartRequest,
  AgentPairingStartResponse,
} from "@lanstream/protocol";
import { spawn } from "node:child_process";

function openBrowser(url: string): void {
  const command =
    process.platform === "win32"
      ? ["cmd", ["/c", "start", "", url]]
      : process.platform === "darwin"
        ? ["open", [url]]
        : ["xdg-open", [url]];
  try {
    const child = spawn(command[0] as string, command[1] as string[], {
      detached: true,
      stdio: "ignore",
    });
    child.on("error", () => undefined);
    child.unref();
  } catch {
    // Headless/service installations can open the printed URL on another device.
  }
}

export class PairingClient {
  private readonly portalUrl: string;

  constructor(portalUrl: string) {
    this.portalUrl = portalUrl.replace(/\/$/, "");
  }

  async pair(input: AgentPairingStartRequest): Promise<string> {
    const started = await this.post<AgentPairingStartResponse>(
      "/api/agent/pair/start",
      input,
    );
    console.log(`[agent] Pairing code: ${started.userCode}`);
    console.log(`[agent] Approve this host: ${started.verificationUrl}`);
    openBrowser(started.verificationUrl);

    const deadline = Date.now() + started.expiresInSeconds * 1_000;
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 2_000));
      const response = await fetch(`${this.portalUrl}/api/agent/pair/poll`, {
        method: "POST",
        headers: { Authorization: `Bearer ${started.pairingSecret}` },
        signal: AbortSignal.timeout(10_000),
      });
      if (response.status === 202) continue;
      const payload = (await response.json().catch(() => null)) as {
        data?: AgentPairingPollResponse;
        error?: { message?: string };
      } | null;
      if (
        response.ok &&
        payload?.data?.status === "connected" &&
        payload.data.token
      ) {
        return payload.data.token;
      }
      throw new Error(
        payload?.error?.message ?? `Pairing failed (${response.status})`,
      );
    }
    throw new Error("Pairing request expired");
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.portalUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    const payload = (await response.json().catch(() => null)) as {
      data?: T;
      error?: { message?: string };
    } | null;
    if (!response.ok || !payload?.data) {
      throw new Error(
        payload?.error?.message ?? `Pairing failed (${response.status})`,
      );
    }
    return payload.data;
  }
}
