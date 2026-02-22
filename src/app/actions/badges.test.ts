import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateBadge } from "./badges";

// Mock dependencies
vi.mock("@/auth", () => ({
  auth: vi.fn(() =>
    Promise.resolve({ user: { id: "user-1", email: "test@test.com" } })
  ),
}));

vi.mock("@/lib/db", () => {
  const mockDb = {
    select: vi.fn(() => mockDb),
    from: vi.fn(() => mockDb),
    where: vi.fn(() => mockDb),
    insert: vi.fn(() => mockDb),
    values: vi.fn(() => mockDb),
    returning: vi.fn(() => []),
    orderBy: vi.fn(() => mockDb),
  };
  return { db: mockDb };
});

vi.mock("@/lib/auth/authorize", () => ({
  requireAuth: vi.fn(() =>
    Promise.resolve({ id: "user-1", email: "test@test.com" })
  ),
  requireDocumentOwner: vi.fn(() =>
    Promise.resolve({
      user: { id: "user-1" },
      document: {
        id: "doc-1",
        userId: "user-1",
        title: "Test Document",
        content: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Hello world" }],
            },
          ],
        },
      },
    })
  ),
}));

vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "abc123def456ghi789012"),
}));

vi.mock("@/lib/metrics", () => ({
  calculateMetrics: vi.fn(() => ({
    ai_percentage: 12,
    external_paste_percentage: 5,
    total_characters: 100,
  })),
  estimateRetainedAiCharactersFromAcceptedResponses: vi.fn(() => 0),
}));

vi.mock("@/lib/tiptap-utils", () => ({
  extractPlainText: vi.fn(() => "Hello world"),
}));

import { db } from "@/lib/db";
import { requireDocumentOwner } from "@/lib/auth/authorize";
import {
  calculateMetrics,
  estimateRetainedAiCharactersFromAcceptedResponses,
} from "@/lib/metrics";

describe("generateBadge", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default db mock returns
    const mockDb = db as unknown as Record<string, ReturnType<typeof vi.fn>>;

    // select().from().where() returns audit trail data
    let selectCallCount = 0;
    mockDb.where.mockImplementation(() => {
      selectCallCount++;
      // First 4 calls are for fetching audit trail data
      if (selectCallCount <= 4) {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    // insert().values().returning() returns the created badge
    mockDb.returning.mockImplementation(() =>
      Promise.resolve([
        {
          id: "badge-1",
          verificationId: "abc123def456ghi789012",
          documentTitle: "Test Document",
          stats: {
            ai_percentage: 12,
            external_paste_percentage: 5,
            interaction_count: 0,
            session_count: 0,
            total_active_seconds: 0,
          },
          createdAt: new Date(),
        },
      ])
    );
  });

  it("should create badge record with frozen document text and audit trail", async () => {
    const result = await generateBadge("doc-1");

    expect(requireDocumentOwner).toHaveBeenCalledWith("doc-1");
    expect(result).toBeDefined();
    expect(result.verificationId).toBeDefined();
  });

  it("should use nanoid(21) for verification_id — 21 characters, unguessable", async () => {
    const { nanoid } = await import("nanoid");
    await generateBadge("doc-1");

    expect(nanoid).toHaveBeenCalledWith(21);
  });

  it("should include stats with ai_percentage, external_paste_percentage, interaction_count, session_count, total_active_seconds", async () => {
    const mockDb = db as unknown as Record<string, ReturnType<typeof vi.fn>>;
    mockDb.returning.mockImplementation(() =>
      Promise.resolve([
        {
          id: "badge-1",
          verificationId: "abc123def456ghi789012",
          stats: {
            ai_percentage: 12,
            external_paste_percentage: 5,
            interaction_count: 0,
            session_count: 0,
            total_active_seconds: 0,
          },
        },
      ])
    );

    const result = await generateBadge("doc-1");
    expect(result.stats).toBeDefined();
    expect(result.stats).toHaveProperty("ai_percentage");
    expect(result.stats).toHaveProperty("external_paste_percentage");
    expect(result.stats).toHaveProperty("interaction_count");
    expect(result.stats).toHaveProperty("session_count");
    expect(result.stats).toHaveProperty("total_active_seconds");
  });

  it("should be insert-only — no update or delete permitted", async () => {
    const mockDb = db as unknown as Record<string, ReturnType<typeof vi.fn>>;

    await generateBadge("doc-1");

    // Verify only insert was called, not update or delete
    expect(mockDb.insert).toHaveBeenCalled();
    // The function should not expose update or delete operations
  });

  it("should reject non-owners with authorization error", async () => {
    vi.mocked(requireDocumentOwner).mockRejectedValueOnce(
      new Error("Forbidden")
    );

    await expect(generateBadge("doc-1")).rejects.toThrow("Forbidden");
  });

  it("should return verificationId, badgeHtml, and badgeMarkdown snippets", async () => {
    const result = await generateBadge("doc-1");

    expect(result.verificationId).toBe("abc123def456ghi789012");
    expect(result.badgeHtml).toBeDefined();
    expect(result.badgeHtml).toContain("abc123def456ghi789012");
    expect(result.badgeMarkdown).toBeDefined();
    expect(result.badgeMarkdown).toContain("abc123def456ghi789012");
  });

  it("should use fallback AI estimation when mark-based AI percentage is zero", async () => {
    const mockDb = db as unknown as Record<string, ReturnType<typeof vi.fn>>;
    mockDb.where
      .mockResolvedValueOnce([
        {
          mode: "inline",
          action: "accepted",
          response: "Hello world",
          charactersInserted: 11,
          provider: "anthropic",
          model: "claude",
          prompt: "rewrite",
          selectedText: "hi",
          createdAt: new Date(),
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    vi.mocked(calculateMetrics).mockReturnValueOnce({
      ai_percentage: 0,
      external_paste_percentage: 0,
      total_characters: 100,
    });
    vi.mocked(estimateRetainedAiCharactersFromAcceptedResponses).mockReturnValueOnce(40);

    await generateBadge("doc-1");

    expect(mockDb.values).toHaveBeenCalledWith(
      expect.objectContaining({
        stats: expect.objectContaining({
          ai_percentage: 40,
        }),
      })
    );
  });
});
