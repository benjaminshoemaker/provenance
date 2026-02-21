import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockInsert: vi.fn(),
  mockValues: vi.fn(),
  mockReturning: vi.fn(),
}));

vi.mock("@/lib/auth/authorize", () => ({
  requireAuth: mocks.mockAuth,
}));

vi.mock("@/lib/db", () => ({
  db: {
    insert: mocks.mockInsert,
  },
}));

vi.mock("@/lib/db/schema", () => ({
  pasteEvents: { _table: "paste_events" },
}));

import { logPasteEvent } from "./paste-events";

describe("logPasteEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockAuth.mockResolvedValue({ id: "user-1" });
    mocks.mockReturning.mockResolvedValue([
      { id: "paste-1", documentId: "doc-1", content: "pasted text", sourceType: "external", characterCount: 11 },
    ]);
    mocks.mockValues.mockReturnValue({ returning: mocks.mockReturning });
    mocks.mockInsert.mockReturnValue({ values: mocks.mockValues });
  });

  it("should write paste event to paste_events table", async () => {
    const result = await logPasteEvent({
      documentId: "doc-1",
      content: "pasted text",
      sourceType: "external",
      characterCount: 11,
    });

    expect(mocks.mockInsert).toHaveBeenCalled();
    expect(mocks.mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: "doc-1",
        content: "pasted text",
        sourceType: "external",
        characterCount: 11,
      })
    );
    expect(result).toEqual(
      expect.objectContaining({ id: "paste-1" })
    );
  });

  it("should require authentication", async () => {
    mocks.mockAuth.mockRejectedValue(new Error("Unauthorized"));

    await expect(
      logPasteEvent({
        documentId: "doc-1",
        content: "test",
        sourceType: "external",
        characterCount: 4,
      })
    ).rejects.toThrow("Unauthorized");
  });
});
