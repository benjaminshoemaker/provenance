import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Cross-user security tests.
 *
 * These tests verify that mutation actions reject attempts by
 * non-owners to write to documents they don't own.
 */

const mocks = vi.hoisted(() => ({
  mockRequireDocumentOwner: vi.fn(),
  mockRequireAuth: vi.fn(),
  mockInsert: vi.fn(),
  mockUpdate: vi.fn(),
  mockSelect: vi.fn(),
  mockFrom: vi.fn(),
  mockWhere: vi.fn(),
  mockValues: vi.fn(),
  mockReturning: vi.fn(),
  mockSet: vi.fn(),
}));

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
  aiInteractions: { _table: "ai_interactions" },
  pasteEvents: { _table: "paste_events" },
  revisions: { _table: "revisions" },
  writingSessions: {
    id: "id",
    documentId: "document_id",
    userId: "user_id",
    activeSeconds: "active_seconds",
    lastHeartbeat: "last_heartbeat",
  },
}));

vi.mock("@/lib/auth/authorize", () => ({
  requireAuth: mocks.mockRequireAuth,
  requireDocumentOwner: mocks.mockRequireDocumentOwner,
}));

vi.mock("@/lib/tiptap-utils", () => ({
  extractPlainText: vi.fn(() => "plain text"),
}));

vi.mock("drizzle-orm", () => ({
  and: vi.fn((...conds: unknown[]) => ({ _and: conds })),
  eq: vi.fn((col: unknown, val: unknown) => ({ _eq: { col, val } })),
  sql: vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({
    _sql: strings.join("?"),
    _values: values,
  })),
}));

import { logAIInteraction } from "./ai-interactions";
import { logPasteEvent } from "./paste-events";
import { createRevision } from "./revisions";
import { startSession, heartbeat, endSession } from "./sessions";

describe("Cross-user security: AI interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject AI interaction logging for non-owner's document", async () => {
    mocks.mockRequireDocumentOwner.mockRejectedValue(new Error("Forbidden"));

    await expect(
      logAIInteraction({
        documentId: "other-users-doc",
        mode: "inline",
        prompt: "test",
        response: "test",
        action: "accepted",
        provider: "anthropic",
        model: "",
      })
    ).rejects.toThrow("Forbidden");

    expect(mocks.mockInsert).not.toHaveBeenCalled();
  });
});

describe("Cross-user security: Paste events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject paste event logging for non-owner's document", async () => {
    mocks.mockRequireDocumentOwner.mockRejectedValue(new Error("Forbidden"));

    await expect(
      logPasteEvent({
        documentId: "other-users-doc",
        content: "pasted text",
        sourceType: "external",
        characterCount: 11,
      })
    ).rejects.toThrow("Forbidden");

    expect(mocks.mockInsert).not.toHaveBeenCalled();
  });
});

describe("Cross-user security: Revisions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject revision creation for non-owner's document", async () => {
    mocks.mockRequireDocumentOwner.mockRejectedValue(new Error("Forbidden"));

    await expect(
      createRevision({
        documentId: "other-users-doc",
        content: { type: "doc", content: [] },
        trigger: "interval",
      })
    ).rejects.toThrow("Forbidden");

    expect(mocks.mockInsert).not.toHaveBeenCalled();
  });
});

describe("Cross-user security: Writing sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockReturning.mockResolvedValue([]);
    mocks.mockWhere.mockReturnValue({ returning: mocks.mockReturning });
    mocks.mockSet.mockReturnValue({ where: mocks.mockWhere });
    mocks.mockUpdate.mockReturnValue({ set: mocks.mockSet });
  });

  it("should reject session creation for non-owner's document", async () => {
    mocks.mockRequireDocumentOwner.mockRejectedValue(new Error("Forbidden"));

    await expect(startSession("other-users-doc")).rejects.toThrow("Forbidden");
    expect(mocks.mockInsert).not.toHaveBeenCalled();
  });

  it("should reject heartbeat for session owned by different user", async () => {
    mocks.mockRequireAuth.mockResolvedValue({ id: "attacker-user" });
    // Returning empty means no session matched the userId constraint
    mocks.mockReturning.mockResolvedValue([]);

    await expect(heartbeat("victim-session-id")).rejects.toThrow("Not found");
  });

  it("should reject endSession for session owned by different user", async () => {
    mocks.mockRequireAuth.mockResolvedValue({ id: "attacker-user" });
    mocks.mockReturning.mockResolvedValue([]);

    await expect(endSession("victim-session-id")).rejects.toThrow("Not found");
  });
});
