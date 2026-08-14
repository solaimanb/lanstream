import { describe, expect, it, vi } from "vitest";
import { logger } from "./logger";

describe("Logger Utility", () => {
  it("formats and outputs info logs", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.info("TEST", "System starting up", { port: 3000 });
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toContain("INFO  [TEST] System starting up");
    expect(spy.mock.calls[0][0]).toContain('"port":3000');
    spy.mockRestore();
  });

  it("formats and outputs error logs with Error object", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const err = new Error("Database query failed");
    logger.error("DB", "Failed to connect", err);
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toContain("ERROR [DB] Failed to connect");
    expect(spy.mock.calls[0][0]).toContain("Database query failed");
    spy.mockRestore();
  });
});
