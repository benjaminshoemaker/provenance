import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  mockRequireDocumentOwner: vi.fn(),
  mockInsert: vi.fn(),
  mockValues: vi.fn(),
  mockReturning: vi.fn(),
}));

vi.mock("@/lib/auth/authorize", () => ({
  requireDocumentOwner: mocks.mockRequireDocumentOwner,
}));

vi.mock("@/lib/db", () => ({
  db: {
    insert: mocks.mockInsert,
  },
}));

vi.mock("@/lib/db/schema", () => ({
  revisions: { _table: "revisions" },
}));

import { createRevision } from "./revisions";

describe("createRevision", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockRequireDocumentOwner.mockResolvedValue({
      user: { id: "user-1" },
      document: { id: "doc-1", userId: "user-1" },
    });
    mocks.mockReturning.mockResolvedValue([
      {
        id: "rev-1",
        documentId: "doc-1",
        content: {},
        plainText: "Hello world",
        trigger: "interval",
      },
    ]);
    mocks.mockValues.mockReturnValue({ returning: mocks.mockReturning });
    mocks.mockInsert.mockReturnValue({ values: mocks.mockValues });
  });

  it("should snapshot current content with plain text extraction", async () => {
    const content = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Hello world" }],
        },
      ],
    };

    const result = await createRevision({
      documentId: "doc-1",
      content,
      trigger: "interval",
    });

    expect(mocks.mockInsert).toHaveBeenCalled();
    expect(mocks.mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: "doc-1",
        content,
        plainText: "Hello world",
        trigger: "interval",
      })
    );
    expect(result).toEqual(expect.objectContaining({ id: "rev-1" }));
  });

  it("should handle ai_interaction trigger", async () => {
    const content = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "AI text" }],
        },
      ],
    };

    await createRevision({
      documentId: "doc-1",
      content,
      trigger: "ai_interaction",
    });

    expect(mocks.mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: "ai_interaction",
      })
    );
  });

  it("should require authentication", async () => {
    mocks.mockRequireDocumentOwner.mockRejectedValue(new Error("Unauthorized"));

    await expect(
      createRevision({
        documentId: "doc-1",
        content: { type: "doc" },
        trigger: "interval",
      })
    ).rejects.toThrow("Unauthorized");
  });
});
