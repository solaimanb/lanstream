/**
 * Application database schema — servers, host devices, access links, audit events.
 *
 * All application tables live under the 'app' schema namespace
 * to keep them separate from auth tables.
 */
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

/* ------------------------------------------------------------------ */
/*  host_agents — paired physical machines controlled by an owner     */
/* ------------------------------------------------------------------ */
export const hostAgent = pgTable(
  "host_agent",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    tokenPrefix: text("token_prefix").notNull(),
    hostname: text("hostname"),
    platform: text("platform"),
    version: text("version"),
    localIp: text("local_ip"),
    lastSeenAt: timestamp("last_seen_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("host_agent_owner_id_idx").on(table.ownerId)],
);

/* ------------------------------------------------------------------ */
/*  agent_pairings — short-lived browser authorization requests       */
/* ------------------------------------------------------------------ */
export const agentPairing = pgTable(
  "agent_pairing",
  {
    id: text("id").primaryKey(),
    secretHash: text("secret_hash").notNull().unique(),
    userCodeHash: text("user_code_hash").notNull().unique(),
    requestedName: text("requested_name").notNull(),
    hostname: text("hostname").notNull(),
    platform: text("platform").notNull(),
    version: text("version").notNull(),
    localIp: text("local_ip").notNull(),
    status: text("status", {
      enum: ["pending", "approved", "consumed"],
    })
      .notNull()
      .default("pending"),
    ownerId: text("owner_id").references(() => user.id, {
      onDelete: "cascade",
    }),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    approvedAt: timestamp("approved_at", { mode: "date" }),
    consumedAt: timestamp("consumed_at", { mode: "date" }),
  },
  (table) => [
    index("agent_pairing_expires_at_idx").on(table.expiresAt),
    index("agent_pairing_owner_id_idx").on(table.ownerId),
  ],
);

/* ------------------------------------------------------------------ */
/*  servers — registered media servers owned by a portal user          */
/* ------------------------------------------------------------------ */
export const server = pgTable(
  "server",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    mediaPath: text("media_path").notNull().default("./media"),
    hostAgentId: text("host_agent_id").references(() => hostAgent.id, {
      onDelete: "set null",
    }),
    desiredState: text("desired_state", { enum: ["running", "stopped"] })
      .notNull()
      .default("running"),
    preferredPort: integer("preferred_port"),
    status: text("status", {
      enum: ["online", "offline", "starting", "stopping"],
    })
      .notNull()
      .default("offline"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("server_owner_id_idx").on(table.ownerId),
    index("server_host_agent_id_idx").on(table.hostAgentId),
    uniqueIndex("server_host_agent_port_idx").on(
      table.hostAgentId,
      table.preferredPort,
    ),
  ],
);

/* ------------------------------------------------------------------ */
/*  host_devices — physical machines running the Node.js LAN Host    */
/* ------------------------------------------------------------------ */
export const hostDevice = pgTable(
  "host_device",
  {
    id: text("id").primaryKey(),
    serverId: text("server_id")
      .notNull()
      .unique()
      .references(() => server.id, { onDelete: "cascade" }),
    hostname: text("hostname").notNull(),
    platform: text("platform").notNull(),
    version: text("version").notNull(),
    localIp: text("local_ip").notNull(),
    port: integer("port").notNull(),
    lastSeenAt: timestamp("last_seen_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("host_device_server_id_idx").on(table.serverId)],
);

/* ------------------------------------------------------------------ */
/*  access_links — revocable tokens for guest file streaming          */
/* ------------------------------------------------------------------ */
export const accessLink = pgTable(
  "access_link",
  {
    id: text("id").primaryKey(),
    serverId: text("server_id")
      .notNull()
      .references(() => server.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    tokenPrefix: text("token_prefix").notNull(),
    purpose: text("purpose", { enum: ["host", "guest"] })
      .notNull()
      .default("guest"),
    description: text("description"),
    expiresAt: timestamp("expires_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("access_link_server_id_idx").on(table.serverId)],
);

/* ------------------------------------------------------------------ */
/*  audit_events — append-only log of significant actions              */
/* ------------------------------------------------------------------ */
export const auditEvent = pgTable(
  "audit_event",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id"),
    metadata: text("metadata"), // JSON string
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("audit_event_user_id_idx").on(table.userId)],
);
