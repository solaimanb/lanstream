/**
 * E2E test — Marketing landing page.
 */
import { expect, test } from "@playwright/test";

test.describe("Marketing landing page", () => {
  test("renders the landing page", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=LANStream")).toBeVisible();
  });

  test("has sign in and sign up links", async ({ page }) => {
    await page.goto("/");
    const signInLink = page.locator('a[href="/sign-in"]');
    const signUpLink = page.locator('a[href="/sign-up"]');
    await expect(signInLink).toBeVisible();
    await expect(signUpLink).toBeVisible();
  });
});
