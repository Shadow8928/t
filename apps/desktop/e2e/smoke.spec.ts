import { test, expect } from "@playwright/test";

test("auth page shows System wordmark and local demo", async ({ page }) => {
  await page.goto("/auth");
  await expect(page.getByRole("heading", { name: "System" })).toBeVisible();
  await page.getByRole("button", { name: /Continue offline/i }).click();
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Timer" })).toBeVisible();
});

