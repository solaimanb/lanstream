/**
 * Ownership verification helpers.
 *
 * Provides a reusable guard that checks whether the current
 * user owns the requested resource.
 */
import type { Result } from "@/lib/result";
import type { ServerDTO } from "@/types";
import { verifyOwnership } from "@/server/dal/servers";
import "server-only";

/** Verify that a user owns a server. Returns the server DTO on success. */
export async function ensureServerOwnership(
  serverId: string,
  userId: string,
): Promise<Result<ServerDTO, "not_found" | "forbidden">> {
  return verifyOwnership(serverId, userId);
}
