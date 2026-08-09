/**
 * @lanstream/protocol
 *
 * Shared types for portal ↔ host communication.
 * Both the Next.js portal and Node.js host import from this package
 * to ensure API contracts stay in sync.
 */

/* ------------------------------------------------------------------ */
/*  Runtime API — Host → Portal                                        */
/* ------------------------------------------------------------------ */

/** Host device information sent in claim/heartbeat. */
export interface HostDeviceInfo {
  hostname: string;
  platform: string;
  version: string;
  localIp: string;
  port: number;
}

/** POST /api/runtime/claim */
export interface ClaimRequest {
  serverId: string;
  hostDeviceInfo: HostDeviceInfo;
}

export interface ClaimResponse {
  hostDeviceId: string;
  serverId: string;
  /** Local directory path to serve media from. */
  mediaPath: string;
  /** SHA-256 hashes of currently active guest access tokens. */
  accessTokenHashes: string[];
}

/** POST /api/runtime/heartbeat */
export interface HeartbeatRequest {
  serverId: string;
  hostDeviceId: string;
  status: ServerStatus;
  hostDeviceInfo?: HostDeviceInfo;
}

export interface HeartbeatResponse {
  acknowledged: boolean;
  nextIntervalMs: number;
  /** Commands the portal wants the host to execute. */
  commands?: PendingCommand[];
  /** Complete active token hash set; replaces the host's previous set. */
  accessTokenHashes: string[];
  /** Updated media path from portal (if changed). */
  mediaPath?: string;
}

export interface ReleaseResponse {
  released: boolean;
}

/** POST /api/runtime/release */
export interface ReleaseRequest {
  serverId: string;
  hostDeviceId: string;
}

/* ------------------------------------------------------------------ */
/*  Agent API — paired device control plane                            */
/* ------------------------------------------------------------------ */

export interface AgentServerReport {
  serverId: string;
  status: ServerStatus;
  port: number;
  error?: string;
}

export interface AgentHeartbeatRequest {
  hostDeviceInfo: Omit<HostDeviceInfo, "port">;
  servers: AgentServerReport[];
}

export interface AgentServerAssignment {
  serverId: string;
  name: string;
  mediaPath: string;
  port: number;
  desiredState: "running" | "stopped";
  accessTokenHashes: string[];
}

export interface AgentHeartbeatResponse {
  acknowledged: boolean;
  nextIntervalMs: number;
  assignments: AgentServerAssignment[];
}

export interface AgentPairingStartRequest {
  requestedName: string;
  hostDeviceInfo: Omit<HostDeviceInfo, "port">;
}

export interface AgentPairingStartResponse {
  pairingSecret: string;
  userCode: string;
  verificationUrl: string;
  expiresInSeconds: number;
}

export interface AgentPairingPollResponse {
  status: "pending" | "connected";
  token?: string;
  agentId?: string;
}

/* ------------------------------------------------------------------ */
/*  Runtime API — Portal → Host                                        */
/* ------------------------------------------------------------------ */

/** Commands the portal sends to the host via heartbeat response. */
export interface PendingCommand {
  id: string;
  type: CommandPayload["type"];
  payload: CommandPayload;
}

export type CommandPayload =
  | { type: "start-stream"; path: string }
  | { type: "stop-stream"; streamId: string }
  | { type: "restart" }
  | { type: "shutdown" };

/* ------------------------------------------------------------------ */
/*  Guest API — Guest → Host                                           */
/* ------------------------------------------------------------------ */

/** GET /status — Host status for guest browsers. */
export interface HostStatusResponse {
  hostname: string;
  platform: string;
  version: string;
  serverName: string;
  status: ServerStatus;
  uptime: number;
}

export interface MediaFile {
  path: string;
  size: number;
  mimeType: string;
}

/** GET /stream/:token/* — File streaming metadata. */
export interface StreamInfo {
  fileName: string;
  fileSize: number;
  mimeType: string;
  lastModified: string;
}

/* ------------------------------------------------------------------ */
/*  Portal API — Shared response envelope                              */
/* ------------------------------------------------------------------ */

/** Standard API success envelope. */
export interface ApiResponse<T> {
  data: T;
  error: null;
}

/** Standard API error envelope. */
export interface ApiError {
  data: null;
  error: {
    code: string;
    message: string;
  };
}

/* ------------------------------------------------------------------ */
/*  Shared Enums                                                       */
/* ------------------------------------------------------------------ */

/** Server status as reported by the LAN Host. */
export type ServerStatus = "online" | "offline" | "starting" | "stopping";
