/**
 * Server-side session helper.
 *
 * Use this to retrieve the authenticated user session
 * in Server Components, Server Actions, and Route Handlers.
 * Returns `null` when no valid session exists.
 */
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import "server-only";

export async function getServerSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}
