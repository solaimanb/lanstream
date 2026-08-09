/**
 * E2E test — Health API.
 */
import { expect, test } from "@playwright/test";

test.describe("API Health", () => {
  test("health endpoint returns 200", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();
  });
});
