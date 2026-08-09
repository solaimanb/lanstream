/**
 * Runtime API validation schemas (host claim, heartbeat, etc.).
 */
import "server-only";
import { z } from "zod";

const ipAddressSchema = z.union([z.ipv4(), z.ipv6()]);

/** Schema for host claim requests. */
export const claimSchema = z.object({
  serverId: z.uuid(),
  hostDeviceInfo: z.object({
    hostname: z.string().min(1).max(255),
    platform: z.string().min(1).max(127),
    version: z.string().min(1).max(63),
    localIp: ipAddressSchema,
    port: z.number().int().min(1).max(65535),
  }),
});

/** Schema for heartbeat requests. */
export const heartbeatSchema = z.object({
  serverId: z.uuid(),
  hostDeviceId: z.uuid(),
  status: z.enum(["online", "offline", "starting", "stopping"]),
  hostDeviceInfo: z
    .object({
      hostname: z.string().min(1).max(255),
      platform: z.string().min(1).max(127),
      version: z.string().min(1).max(63),
      localIp: ipAddressSchema,
      port: z.number().int().min(1).max(65535),
    })
    .optional(),
});

/** Schema for host release requests. */
export const releaseSchema = z.object({
  serverId: z.uuid(),
  hostDeviceId: z.uuid(),
});

/** Schema for the paired host agent control-plane heartbeat. */
export const agentHeartbeatSchema = z.object({
  hostDeviceInfo: z.object({
    hostname: z.string().min(1).max(255),
    platform: z.string().min(1).max(127),
    version: z.string().min(1).max(63),
    localIp: ipAddressSchema,
  }),
  servers: z
    .array(
      z.object({
        serverId: z.uuid(),
        status: z.enum(["online", "offline", "starting", "stopping"]),
        port: z.number().int().min(1024).max(65535),
        error: z.string().max(512).optional(),
      }),
    )
    .max(100),
});

export type ClaimInput = z.infer<typeof claimSchema>;
export type HeartbeatInput = z.infer<typeof heartbeatSchema>;
export type ReleaseInput = z.infer<typeof releaseSchema>;
