/**
 * Shared DAL utilities.
 */
import "server-only";

/** Generate a UUID for persisted entities and public API identifiers. */
export function nanoid(): string {
  return crypto.randomUUID();
}
