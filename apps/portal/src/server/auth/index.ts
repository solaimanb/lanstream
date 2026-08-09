/**
 * Better Auth server configuration.
 *
 * This is the central auth instance — import from here in all
 * server-side auth code. Do NOT import from client components.
 */
import { BETTER_AUTH_SECRET, PORTAL_URL } from "@/lib/env";
import { db } from "@/server/db/client";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import "server-only";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  baseURL: PORTAL_URL,
  trustedOrigins: [PORTAL_URL],
  secret: BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    useSecureCookies: PORTAL_URL.startsWith("https://"),
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    /**
     * Cookie cache avoids a DB round-trip on every getServerSession()
     * call. The session is stored in a signed cookie and refreshed
     * automatically when 80% of maxAge has elapsed.
     * See: https://www.better-auth.com/docs/concepts/session-management#cookie-cache
     */
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
});

export type Session = typeof auth.$Infer.Session;
