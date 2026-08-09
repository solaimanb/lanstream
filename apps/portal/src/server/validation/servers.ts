/**
 * Server-related validation schemas.
 */
import "server-only";
import { z } from "zod";

/** Schema for creating a new server. */
export const createServerSchema = z.object({
  name: z
    .string()
    .min(1, "Server name is required")
    .max(64, "Server name must be 64 characters or fewer")
    .trim(),
  mediaPath: z
    .string()
    .min(1, "Media path is required")
    .max(512, "Media path must be 512 characters or fewer")
    .trim(),
  hostAgentId: z.uuid().optional(),
});

/** Schema for updating server metadata. */
export const updateServerSchema = z.object({
  name: z
    .string()
    .min(1, "Server name cannot be empty")
    .max(64, "Server name must be 64 characters or fewer")
    .trim()
    .optional(),
  mediaPath: z
    .string()
    .min(1, "Media path cannot be empty")
    .max(512, "Media path must be 512 characters or fewer")
    .trim()
    .optional(),
});

export type CreateServerInput = z.infer<typeof createServerSchema>;
export type UpdateServerInput = z.infer<typeof updateServerSchema>;
