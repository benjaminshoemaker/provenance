import fs from "node:fs/promises";
import path from "node:path";
import { test as setup, expect, type Page } from "@playwright/test";
import {
  AUTH_STATE_AUTHOR_A_PATH,
  AUTH_STATE_AUTHOR_B_PATH,
  buildE2ELoginPath,
} from "../helpers/auth";

async function bootstrapAuthState(
  page: Page,
  userKey: string,
  storageStatePath: string
) {
  await fs.mkdir(path.dirname(storageStatePath), { recursive: true });
  await page.goto(buildE2ELoginPath(userKey));
  await page.getByTestId("e2e-login-submit").click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  await expect(
    page.getByRole("heading", { name: "Documents" })
  ).toBeVisible({ timeout: 15_000 });
  await page.context().storageState({ path: storageStatePath });
}

setup("should create author-a auth state", async ({ page }) => {
  await bootstrapAuthState(page, "author-a", AUTH_STATE_AUTHOR_A_PATH);
});

setup("should create author-b auth state", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await bootstrapAuthState(page, "author-b", AUTH_STATE_AUTHOR_B_PATH);
  } finally {
    await context.close();
  }
});
