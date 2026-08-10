/**
 * Environment variable validation.
 *
 * Import this module in server-side code to access validated environment variables.
 * Never use NEXT_PUBLIC_ prefix for secrets.
 */

import "server-only";

function getEnvVar(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Database
export const DATABASE_URL = getEnvVar("DATABASE_URL");

// App
export const NODE_ENV = getEnvVar("NODE_ENV", "development");
export const PORTAL_URL = getEnvVar("PORTAL_URL", "http://localhost:3000");

// Auth
export const BETTER_AUTH_SECRET = getEnvVar("BETTER_AUTH_SECRET");
export const BETTER_AUTH_URL = getEnvVar("BETTER_AUTH_URL", PORTAL_URL);
export const ADDITIONAL_TRUSTED_ORIGINS = getEnvVar("ADDITIONAL_TRUSTED_ORIGINS", "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

if (NODE_ENV === "production" && BETTER_AUTH_SECRET.length < 32) {
  throw new Error("BETTER_AUTH_SECRET must be at least 32 characters in production");
}
