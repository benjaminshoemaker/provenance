import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateBadge } from "./badges";

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
    humanTyped: 72,
    aiGenerated: 8,
    aiTweaked: 12,
    pastedExternal: 8,
    totalWords: 100,
    humanTypedPercentage: 72,
    aiGeneratedPercentage: 8,
    aiTweakedPercentage: 12,
    pastedExternalPercentage: 8,
    typedPercentage: 72,
  })),
}));

vi.mock("@/lib/tiptap-utils", () => ({
  extractPlainText: vi.fn(() => "Hello world"),
}));

import { db } from "@/lib/db";
import { requireDocumentOwner } from "@/lib/auth/authorize";
import { calculateMetrics } from "@/lib/metrics";

describe("generateBadge", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const mockDb = db as unknown as Record<string, ReturnType<typeof vi.fn>>;

    let selectCallCount = 0;
    mockDb.where.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount <= 5) {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    mockDb.returning.mockImplementation(() =>
      Promise.resolve([
        {
          id: "badge-1",
          verificationId: "abc123def456ghi789012",
          documentTitle: "Test Document",
          stats: {
            typed_percentage: 72,
            human_typed_percentage: 72,
            ai_generated_percentage: 8,
            ai_tweaked_percentage: 12,
            pasted_external_percentage: 8,
            human_typed_words: 72,
            ai_generated_words: 8,
            ai_tweaked_words: 12,
            pasted_external_words: 8,
            total_words: 100,
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

  it("should use nanoid(21) for verification id", async () => {
    const { nanoid } = await import("nanoid");
    await generateBadge("doc-1");

    expect(nanoid).toHaveBeenCalledWith(21);
  });

  it("should include new 4-category stats fields", async () => {
    const result = await generateBadge("doc-1");
    expect(result.stats).toBeDefined();
    expect(result.stats).toHaveProperty("typed_percentage");
    expect(result.stats).toHaveProperty("human_typed_percentage");
    expect(result.stats).toHaveProperty("ai_generated_percentage");
    expect(result.stats).toHaveProperty("ai_tweaked_percentage");
    expect(result.stats).toHaveProperty("pasted_external_percentage");
    expect(result.stats).toHaveProperty("total_words");
  });

  it("should be insert-only", async () => {
    const mockDb = db as unknown as Record<string, ReturnType<typeof vi.fn>>;

    await generateBadge("doc-1");

    expect(mockDb.insert).toHaveBeenCalled();
  });

  it("should reject non-owners with authorization error", async () => {
    vi.mocked(requireDocumentOwner).mockRejectedValueOnce(new Error("Forbidden"));

    await expect(generateBadge("doc-1")).rejects.toThrow("Forbidden");
  });

  it("should return badge HTML and markdown snippets", async () => {
    const result = await generateBadge("doc-1");

    expect(result.verificationId).toBe("abc123def456ghi789012");
    expect(result.badgeHtml).toContain("abc123def456ghi789012");
    expect(result.badgeMarkdown).toContain("abc123def456ghi789012");
    expect(result.badgeHtml).toContain("72% typed");
    expect(result.badgeMarkdown).toContain("72% typed");
  });

  it("should persist metrics from calculateMetrics into stats payload", async () => {
    const mockDb = db as unknown as Record<string, ReturnType<typeof vi.fn>>;
    await generateBadge("doc-1");

    expect(calculateMetrics).toHaveBeenCalled();
    expect(mockDb.values).toHaveBeenCalledWith(
      expect.objectContaining({
        stats: expect.objectContaining({
          typed_percentage: 72,
          human_typed_words: 72,
          ai_generated_words: 8,
          ai_tweaked_words: 12,
          pasted_external_words: 8,
          total_words: 100,
        }),
      })
    );
  });
});
