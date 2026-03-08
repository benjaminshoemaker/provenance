import { test, expect } from "@playwright/test";
import { AUTH_STATE_AUTHOR_B_PATH } from "./helpers/auth";

test("should block author-b from author-a document routes", async ({
  browser,
  page,
}) => {
  const title = `Isolation doc ${Date.now()}`;

  await page.goto("/dashboard");
  await expect(page.getByTestId("new-document")).toBeEnabled({ timeout: 15_000 });
  await Promise.all([
    page.waitForURL(/\/editor\/[0-9a-f-]+$/, { timeout: 15_000 }),
    page.getByTestId("new-document").click(),
  ]);

  await page.getByTestId("document-title").fill(title);
  const editorSurface = page.locator('[data-testid="editor-surface"] .tiptap');
  await editorSurface.click();
  await page.keyboard.type("User A private content.");
  await expect(page.getByTestId("save-indicator")).toHaveText("Saved", {
    timeout: 15_000,
  });

  const authorAEditorUrl = page.url();
  const documentId = authorAEditorUrl.split("/").pop();

  expect(documentId).toBeTruthy();

  const authorBContext = await browser.newContext({
    storageState: AUTH_STATE_AUTHOR_B_PATH,
  });
  const authorBPage = await authorBContext.newPage();

  try {
    await authorBPage.goto(authorAEditorUrl);
    await expect(authorBPage).toHaveURL(/\/dashboard$/);

    await authorBPage.goto("/dashboard");
    const previewResult = await authorBPage.evaluate(async (id) => {
      const response = await fetch(`/api/preview/${id}`);
      return {
        status: response.status,
        body: await response.text(),
      };
    }, documentId!);

    expect(previewResult.status).toBe(404);
    expect(previewResult.body).toContain("Not found");
  } finally {
    await authorBContext.close();
  }
});
