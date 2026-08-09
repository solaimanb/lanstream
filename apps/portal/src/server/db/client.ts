/**
 * PostgreSQL connection using `postgres` driver + Drizzle ORM.
 *
 * This module is server-only and creates a singleton connection
 * to prevent exhausting the connection pool in dev hot-reload.
 */
import { DATABASE_URL } from "@/lib/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import "server-only";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  __db__: ReturnType<typeof postgres> | undefined;
};

const client = globalForDb.__db__ ?? postgres(DATABASE_URL);

if (process.env.NODE_ENV !== "production") {
  globalForDb.__db__ = client;
}

export const db = drizzle(client, { schema });
