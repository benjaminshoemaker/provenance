import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => {
  const mockReturning = vi.fn();
  const mockValues = vi.fn(() => ({ returning: mockReturning }));
  const mockInsert = vi.fn(() => ({ values: mockValues }));
  const mockRequireAuth = vi.fn();

  return {
    mockInsert,
    mockValues,
    mockReturning,
    mockRequireAuth,
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
  },
}));

vi.mock("@/lib/db/schema", () => ({
  aiInteractions: {
    id: "id",
    documentId: "document_id",
    sessionId: "session_id",
    mode: "mode",
    prompt: "prompt",
    selectedText: "selected_text",
    response: "response",
    action: "action",
    documentDiff: "document_diff",
    charactersInserted: "characters_inserted",
    provider: "provider",
    model: "model",
    createdAt: "created_at",
  },
}));

vi.mock("@/lib/auth/authorize", () => ({
  requireAuth: mocks.mockRequireAuth,
  requireDocumentOwner: vi.fn(),
}));

import { logAIInteraction } from "./ai-interactions";

describe("logAIInteraction", () => {
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
      {
        id: "ai-1",
        documentId: "doc-1",
        mode: "inline",
        prompt: "Improve this",
        response: "Here is improved text",
        action: "accepted",
        provider: "anthropic",
        model: "claude-sonnet-4-5-20250514",
      },
    ]);
  });

  it("should write full interaction record to ai_interactions table", async () => {
    const result = await logAIInteraction({
      documentId: "doc-1",
      mode: "inline",
      prompt: "Improve this",
      selectedText: "original text",
      response: "Here is improved text",
      action: "accepted",
      provider: "anthropic",
      model: "claude-sonnet-4-5-20250514",
    });

    expect(mocks.mockRequireAuth).toHaveBeenCalled();
    expect(mocks.mockInsert).toHaveBeenCalled();
    expect(mocks.mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: "doc-1",
        mode: "inline",
        prompt: "Improve this",
        selectedText: "original text",
        response: "Here is improved text",
        action: "accepted",
        provider: "anthropic",
        model: "claude-sonnet-4-5-20250514",
      })
    );
    expect(result).toHaveProperty("id", "ai-1");
  });

  it("should be append-only with no update or delete operations", async () => {
    // logAIInteraction only uses insert — verify no update/delete methods exist
    await logAIInteraction({
      documentId: "doc-1",
      mode: "side_panel",
      prompt: "Help me brainstorm",
      response: "Sure, here are ideas",
      action: "accepted",
      provider: "openai",
      model: "gpt-4o",
    });

    // Only insert is called, never update or delete
    expect(mocks.mockInsert).toHaveBeenCalledTimes(1);
  });

  it("should default charactersInserted to 0 when not provided", async () => {
    await logAIInteraction({
      documentId: "doc-1",
      mode: "freeform",
      prompt: "Write something",
      response: "Here you go",
      action: "accepted",
      provider: "anthropic",
      model: "",
    });

    expect(mocks.mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        charactersInserted: 0,
      })
    );
  });

  it("should require authentication before logging", async () => {
    mocks.mockRequireAuth.mockRejectedValue(new Error("Unauthorized"));

    await expect(
      logAIInteraction({
        documentId: "doc-1",
        mode: "inline",
        prompt: "test",
        response: "test",
        action: "accepted",
        provider: "anthropic",
        model: "",
      })
    ).rejects.toThrow("Unauthorized");

    expect(mocks.mockInsert).not.toHaveBeenCalled();
  });
});
