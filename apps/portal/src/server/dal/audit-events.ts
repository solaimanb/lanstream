/**
 * Data Access Layer — audit events.
 *
 * Append-only log of significant actions. Events are never updated
 * or deleted — they form a tamper-evident history.
 */
import { db } from "@/server/db/client";
import { auditEvent } from "@/server/db/schema";
import { and, desc, eq } from "drizzle-orm";
import "server-only";
import { nanoid } from "./utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface AuditEventDTO {
  id: string;
  userId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: string | null;
  createdAt: Date;
}

function toDTO(row: typeof auditEvent.$inferSelect): AuditEventDTO {
  return {
    id: row.id,
    userId: row.userId,
    action: row.action,
    targetType: row.targetType,
    targetId: row.targetId,
    metadata: row.metadata,
    createdAt: row.createdAt,
  };
}

/* ------------------------------------------------------------------ */
/*  Read operations                                                    */
/* ------------------------------------------------------------------ */

/** List recent audit events (newest first). */
export async function listAuditEvents(limit = 50): Promise<AuditEventDTO[]> {
  const rows = await db
    .select()
    .from(auditEvent)
    .orderBy(desc(auditEvent.createdAt))
    .limit(limit);
  return rows.map(toDTO);
}

/** List audit events for a specific target. */
export async function listAuditEventsByTarget(
  targetType: string,
  targetId: string,
  limit = 50,
): Promise<AuditEventDTO[]> {
  const rows = await db
    .select()
    .from(auditEvent)
    .where(
      and(
        eq(auditEvent.targetType, targetType),
        eq(auditEvent.targetId, targetId),
      ),
    )
    .orderBy(desc(auditEvent.createdAt))
    .limit(limit);
  return rows.map(toDTO);
}

/* ------------------------------------------------------------------ */
/*  Write operations                                                   */
/* ------------------------------------------------------------------ */

/** Append a new audit event. */
export async function createAuditEvent(input: {
  userId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<AuditEventDTO> {
  const id = nanoid();
  const rows = await db
    .insert(auditEvent)
    .values({
      id,
      userId: input.userId ?? null,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      createdAt: new Date(),
    })
    .returning();
  return toDTO(rows[0]);
}
