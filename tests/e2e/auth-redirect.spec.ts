import { test, expect } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test("should redirect dashboard requests to login when unauthenticated", async ({
  page,
}) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fdashboard$/);
  await expect(page.getByTestId("login-google")).toBeVisible();
  await expect(page.getByTestId("login-github")).toBeVisible();
});

test("should redirect editor requests to login when unauthenticated", async ({
  page,
}) => {
  await page.goto("/editor/not-a-real-document");

  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Feditor%2Fnot-a-real-document$/);
});
