/**
 * OpenTelemetry and instrumentation setup.
 * Runs once when the server starts.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Node.js server instrumentation
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    // Edge runtime instrumentation
  }
}
