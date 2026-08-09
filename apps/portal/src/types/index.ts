/**
 * Shared type definitions for the LANStream portal.
 *
 * Re-exports protocol types for backward compatibility.
 * New code should import from '@lanstream/protocol' directly.
 */
import type { HostDeviceInfo, ServerStatus } from "@lanstream/protocol";
export type { HostDeviceInfo, ServerStatus };

/** Minimal server DTO returned by the DAL */
export interface ServerDTO {
  id: string;
  name: string;
  ownerId: string;
  mediaPath: string;
  hostAgentId: string | null;
  desiredState: "running" | "stopped";
  preferredPort: number | null;
  status: ServerStatus;
  createdAt: Date;
  updatedAt: Date;
}

/** Access link for guest file streaming */
export interface AccessLink {
  id: string;
  serverId: string;
  tokenPrefix: string;
  purpose: "host" | "guest";
  description: string | null;
  expiresAt: Date | null;
  createdAt: Date;
}
