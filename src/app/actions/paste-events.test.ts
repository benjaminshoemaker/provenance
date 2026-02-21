import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  mockRequireDocumentOwner: vi.fn(),
  mockInsert: vi.fn(),
  mockSelect: vi.fn(),
  mockFrom: vi.fn(),
  mockWhere: vi.fn(),
  mockValues: vi.fn(),
  mockReturning: vi.fn(),
}));

vi.mock("@/lib/auth/authorize", () => ({
  requireDocumentOwner: mocks.mockRequireDocumentOwner,
}));

vi.mock("@/lib/db", () => ({
  db: {
    insert: mocks.mockInsert,
    select: mocks.mockSelect,
  },
}));

vi.mock("@/lib/db/schema", () => ({
  pasteEvents: { _table: "paste_events" },
  writingSessions: {
    id: "id",
    documentId: "document_id",
    userId: "user_id",
  },
}));

vi.mock("drizzle-orm", () => ({
  and: vi.fn((...conds: unknown[]) => ({ _and: conds })),
  eq: vi.fn((col: unknown, val: unknown) => ({ _eq: { col, val } })),
}));

import { logPasteEvent } from "./paste-events";

describe("logPasteEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockRequireDocumentOwner.mockResolvedValue({
      user: { id: "user-1" },
      document: { id: "doc-1", userId: "user-1" },
    });
    mocks.mockReturning.mockResolvedValue([
      { id: "paste-1", documentId: "doc-1", content: "pasted text", sourceType: "external", characterCount: 11 },
    ]);
    mocks.mockValues.mockReturnValue({ returning: mocks.mockReturning });
    mocks.mockInsert.mockReturnValue({ values: mocks.mockValues });

    mocks.mockWhere.mockResolvedValue([{ id: "session-1" }]);
    mocks.mockFrom.mockReturnValue({ where: mocks.mockWhere });
    mocks.mockSelect.mockReturnValue({ from: mocks.mockFrom });
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

  it("should require a valid sessionId when provided", async () => {
    mocks.mockWhere.mockResolvedValue([]);

    await expect(
      logPasteEvent({
        documentId: "doc-1",
        sessionId: "session-1",
        content: "pasted text",
        sourceType: "external",
        characterCount: 11,
      })
    ).rejects.toThrow("Not found");

    expect(mocks.mockInsert).not.toHaveBeenCalled();
  });

  it("should require authentication", async () => {
    mocks.mockRequireDocumentOwner.mockRejectedValue(new Error("Unauthorized"));

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
