/**
 * Client-side auth helper for use in React Client Components.
 *
 * Do NOT import server-side modules through this file.
 */
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();
