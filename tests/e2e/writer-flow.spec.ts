import { test, expect } from "@playwright/test";

test("should create a document, generate a badge, and load the public verification page", async ({
  browser,
  page,
}) => {
  const title = `E2E badge ${Date.now()}`;
  const body =
    "This is a deterministic end-to-end verification document created by Playwright.";

  await page.goto("/dashboard");
  await expect(page.getByTestId("new-document")).toBeEnabled({ timeout: 15_000 });
  await Promise.all([
    page.waitForURL(/\/editor\/[0-9a-f-]+$/, { timeout: 15_000 }),
    page.getByTestId("new-document").click(),
  ]);

  await page.getByTestId("document-title").fill(title);

  const editorSurface = page.locator('[data-testid="editor-surface"] .tiptap');
  await editorSurface.click();
  await page.keyboard.type(body);

  await expect(page.getByTestId("save-indicator")).toHaveText("Saved", {
    timeout: 15_000,
  });

  const previewHref = await page.getByTestId("generate-badge").getAttribute("href");
  expect(previewHref).toMatch(/^\/editor\/[0-9a-f-]+\/preview$/);

  try {
    await page.goto(previewHref!);
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("ERR_ABORTED")) {
      throw error;
    }
  }
  await expect(page).toHaveURL(/\/editor\/[0-9a-f-]+\/preview$/, {
    timeout: 15_000,
  });
  await expect(page.getByTestId("confirm-generate-badge")).toBeVisible({
    timeout: 15_000,
  });

  await page.getByTestId("confirm-generate-badge").click();
  await expect(page.getByTestId("badge-result")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByTestId("badge-html-snippet")).toContainText("<a href=");
  await expect(page.getByTestId("badge-markdown-snippet")).toContainText("[![");

  const verificationHref =
    await page.getByTestId("verification-url").getAttribute("href");

  expect(verificationHref).toMatch(/^\/verify\/[A-Za-z0-9_-]+$/);

  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();

  try {
    await guestPage.goto(verificationHref!);
    await expect(guestPage.getByTestId("stats-summary")).toBeVisible();
    await expect(guestPage.getByTestId("scope-statement")).toBeVisible();
    await expect(guestPage.getByTestId("audit-timeline")).toBeVisible();
    await expect(
      guestPage.getByRole("heading", { level: 3, name: title })
    ).toBeVisible();
  } finally {
    await guestContext.close();
  }
});
