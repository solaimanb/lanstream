/**
 * Access link validation schemas.
 */
import "server-only";
import { z } from "zod";

/** Schema for creating a new access link. */
export const createAccessLinkSchema = z.object({
  serverId: z.uuid(),
  purpose: z.enum(["host", "guest"]).default("guest"),
  description: z
    .string()
    .max(255, "Description must be 255 characters or fewer")
    .trim()
    .optional(),
  expiresAt: z.coerce
    .date()
    .refine((date) => date > new Date(), "Expiry must be in the future")
    .optional(),
});

/** Schema for revoking an access link. */
export const revokeAccessLinkSchema = z.object({
  linkId: z.uuid(),
  serverId: z.uuid(),
});

export type CreateAccessLinkInput = z.infer<typeof createAccessLinkSchema>;
export type RevokeAccessLinkInput = z.infer<typeof revokeAccessLinkSchema>;
