import type {
  AgentHeartbeatRequest,
  AgentHeartbeatResponse,
} from "@lanstream/protocol";

export class AgentRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AgentRequestError";
  }
}

export class AgentClient {
  constructor(
    private readonly portalUrl: string,
    private readonly token: string,
  ) {}

  async heartbeat(
    input: AgentHeartbeatRequest,
  ): Promise<AgentHeartbeatResponse> {
    const response = await fetch(
      `${this.portalUrl.replace(/\/$/, "")}/api/agent/heartbeat`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(10_000),
      },
    );
    const payload = (await response.json().catch(() => null)) as {
      data?: AgentHeartbeatResponse;
      error?: { message?: string };
    } | null;
    if (!response.ok || !payload?.data) {
      throw new AgentRequestError(
        payload?.error?.message ??
          `Agent heartbeat failed (${response.status})`,
        response.status,
      );
    }
    return payload.data;
  }
}
