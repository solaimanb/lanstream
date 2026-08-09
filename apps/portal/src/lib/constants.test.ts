/**
 * Unit tests — application constants.
 */
import { describe, expect, it } from "vitest";
import {
  HEARTBEAT_INTERVAL_MS,
  HOST_DEFAULT_PORT,
  MAX_ACCESS_LINK_DESCRIPTION_LENGTH,
  MAX_SERVER_NAME_LENGTH,
  OFFLINE_THRESHOLD_MS,
} from "./constants";

describe("Application constants", () => {
  it("HOST_DEFAULT_PORT is a valid port number", () => {
    expect(HOST_DEFAULT_PORT).toBeGreaterThan(0);
    expect(HOST_DEFAULT_PORT).toBeLessThanOrEqual(65535);
    expect(HOST_DEFAULT_PORT).toBe(4780);
  });

  it("HEARTBEAT_INTERVAL_MS is positive and reasonable", () => {
    expect(HEARTBEAT_INTERVAL_MS).toBeGreaterThan(0);
    expect(HEARTBEAT_INTERVAL_MS).toBeGreaterThanOrEqual(5000); // at least 5s
    expect(HEARTBEAT_INTERVAL_MS).toBeLessThanOrEqual(300_000); // at most 5min
    expect(HEARTBEAT_INTERVAL_MS).toBe(30_000);
  });

  it("OFFLINE_THRESHOLD_MS is greater than HEARTBEAT_INTERVAL_MS", () => {
    expect(OFFLINE_THRESHOLD_MS).toBeGreaterThan(HEARTBEAT_INTERVAL_MS);
    expect(OFFLINE_THRESHOLD_MS).toBe(90_000);
  });

  it("MAX_SERVER_NAME_LENGTH is reasonable", () => {
    expect(MAX_SERVER_NAME_LENGTH).toBeGreaterThan(0);
    expect(MAX_SERVER_NAME_LENGTH).toBeLessThanOrEqual(256);
    expect(MAX_SERVER_NAME_LENGTH).toBe(64);
  });

  it("MAX_ACCESS_LINK_DESCRIPTION_LENGTH is reasonable", () => {
    expect(MAX_ACCESS_LINK_DESCRIPTION_LENGTH).toBeGreaterThan(0);
    expect(MAX_ACCESS_LINK_DESCRIPTION_LENGTH).toBeLessThanOrEqual(1024);
    expect(MAX_ACCESS_LINK_DESCRIPTION_LENGTH).toBe(256);
  });
});
