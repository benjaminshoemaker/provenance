import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => {
  const mockReturning = vi.fn();
  const mockValues = vi.fn(() => ({ returning: mockReturning }));
  const mockWhere = vi.fn(() => ({ returning: mockReturning }));
  const mockSet = vi.fn(() => ({ where: mockWhere }));
  const mockInsert = vi.fn(() => ({ values: mockValues }));
  const mockUpdate = vi.fn(() => ({ set: mockSet }));
  const mockSelect = vi.fn();
  const mockRequireAuth = vi.fn();
  const mockRequireDocumentOwner = vi.fn();

  return {
    mockInsert,
    mockUpdate,
    mockSelect,
    mockValues,
    mockReturning,
    mockSet,
    mockWhere,
    mockRequireAuth,
    mockRequireDocumentOwner,
  };
});

vi.mock("@/auth", () => ({
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: { GET: vi.fn(), POST: vi.fn() },
}));

vi.mock("@/lib/db", () => ({
  db: {
    insert: mocks.mockInsert,
    update: mocks.mockUpdate,
    select: mocks.mockSelect,
  },
}));

vi.mock("@/lib/db/schema", () => ({
  documents: {
    id: "id",
    userId: "user_id",
    title: "title",
    content: "content",
    wordCount: "word_count",
    deletedAt: "deleted_at",
    updatedAt: "updated_at",
    createdAt: "created_at",
  },
}));

vi.mock("@/lib/auth/authorize", () => ({
  requireAuth: mocks.mockRequireAuth,
  requireDocumentOwner: mocks.mockRequireDocumentOwner,
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((_col, val) => ({ _eq: val })),
}));

import { createDocument, updateDocument, deleteDocument } from "./documents";

describe("createDocument", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.mockRequireAuth.mockResolvedValue({
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
    });

    mocks.mockInsert.mockReturnValue({ values: mocks.mockValues });
    mocks.mockValues.mockReturnValue({ returning: mocks.mockReturning });
    mocks.mockReturning.mockResolvedValue([
      { id: "doc-1", title: "Untitled", userId: "user-1" },
    ]);
  });

  it("should return a new document ID when creating a document", async () => {
    const result = await createDocument();

    expect(mocks.mockRequireAuth).toHaveBeenCalled();
    expect(mocks.mockInsert).toHaveBeenCalled();
    expect(result).toHaveProperty("id", "doc-1");
  });

  it("should associate document with authenticated user", async () => {
    await createDocument();

    expect(mocks.mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1" })
    );
  });
});

describe("updateDocument", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.mockRequireDocumentOwner.mockResolvedValue({
      user: { id: "user-1", name: "Test User", email: "test@example.com" },
      document: {
        id: "doc-1",
        userId: "user-1",
        title: "Old Title",
        content: '{"type":"doc","content":[]}',
        wordCount: 0,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    mocks.mockUpdate.mockReturnValue({ set: mocks.mockSet });
    mocks.mockSet.mockReturnValue({ where: mocks.mockWhere });
    mocks.mockWhere.mockReturnValue({ returning: mocks.mockReturning });
    mocks.mockReturning.mockResolvedValue([
      { id: "doc-1", title: "New Title", userId: "user-1" },
    ]);
  });

  it("should update title and content when called", async () => {
    const result = await updateDocument("doc-1", { title: "New Title" });

    expect(mocks.mockRequireDocumentOwner).toHaveBeenCalledWith("doc-1");
    expect(mocks.mockUpdate).toHaveBeenCalled();
    expect(result).toHaveProperty("title", "New Title");
  });
});

describe("deleteDocument", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.mockRequireDocumentOwner.mockResolvedValue({
      user: { id: "user-1", name: "Test User", email: "test@example.com" },
      document: {
        id: "doc-1",
        userId: "user-1",
        title: "Test",
        content: '{"type":"doc","content":[]}',
        wordCount: 0,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    mocks.mockUpdate.mockReturnValue({ set: mocks.mockSet });
    mocks.mockSet.mockReturnValue({ where: mocks.mockWhere });
    mocks.mockWhere.mockResolvedValue(undefined);
  });

  it("should set deleted_at (soft-delete) instead of row deletion", async () => {
    await deleteDocument("doc-1");

    expect(mocks.mockRequireDocumentOwner).toHaveBeenCalledWith("doc-1");
    expect(mocks.mockUpdate).toHaveBeenCalled();
    expect(mocks.mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        deletedAt: expect.any(Date),
      })
    );
  });
});
