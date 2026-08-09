/**
 * Host configuration — environment + CLI overrides.
 *
 * Loaded from environment variables with sensible defaults.
 * Environment variables or CLI flags can override these at startup.
 */
import { z } from "zod";

const configSchema = z.object({
  /** Portal API base URL (e.g. "http://192.168.1.100:3000"). */
  portalUrl: z.url(),

  /** Server ID to claim on the portal. */
  serverId: z.uuid().optional(),

  /** Raw access token used to authorize the initial server claim. */
  accessToken: z.string().min(1).optional(),

  /** Durable credential for paired-agent mode. */
  agentToken: z.string().min(1).optional(),

  /** Port to serve files on (guest-facing). */
  port: z.coerce.number().int().min(1024).max(65535).default(4780),

  /**
   * Path to the local media directory.
   * Overridden by portal-provided mediaPath during claim if set.
   */
  mediaPath: z.string().default("./media"),

  /** Heartbeat interval in milliseconds. */
  heartbeatIntervalMs: z.coerce.number().int().min(5000).default(30_000),
});

export type HostConfig = z.infer<typeof configSchema>;

export function loadConfig(overrides: Partial<HostConfig> = {}): HostConfig {
  const raw = {
    portalUrl: process.env.LANSTREAM_PORTAL_URL ?? "http://localhost:3000",
    serverId: process.env.LANSTREAM_SERVER_ID || undefined,
    accessToken: process.env.LANSTREAM_ACCESS_TOKEN || undefined,
    agentToken: process.env.LANSTREAM_AGENT_TOKEN || undefined,
    port: process.env.LANSTREAM_PORT ?? "4780",
    mediaPath: process.env.LANSTREAM_MEDIA_PATH ?? "./media",
    heartbeatIntervalMs: process.env.LANSTREAM_HEARTBEAT_MS ?? "30000",
    ...overrides,
  };

  const result = configSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid host configuration:\n${issues}`);
  }

  return result.data;
}
