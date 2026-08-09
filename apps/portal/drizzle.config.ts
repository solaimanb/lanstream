/**
 * Drizzle Kit configuration.
 *
 * Used by `pnpm drizzle-kit` CLI for migrations and introspection.
 */
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/server/db/schema/*",
  out: "./src/server/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
