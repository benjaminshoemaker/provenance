import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => {
  const mockReturning = vi.fn();
  const mockWhere = vi.fn(() => ({ returning: mockReturning }));
  const mockSet = vi.fn(() => ({ where: mockWhere }));
  const mockUpdate = vi.fn(() => ({ set: mockSet }));
  const mockSelectFrom = vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) }));
  const mockSelect = vi.fn(() => ({ from: mockSelectFrom }));
  const mockRequireAuth = vi.fn();

  return {
    mockUpdate,
    mockSet,
    mockWhere,
    mockReturning,
    mockSelect,
    mockSelectFrom,
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
    update: mocks.mockUpdate,
    select: mocks.mockSelect,
  },
}));

vi.mock("@/lib/db/schema", () => ({
  users: {
    id: "id",
    aiProvider: "ai_provider",
    aiModel: "ai_model",
  },
}));

vi.mock("@/lib/auth/authorize", () => ({
  requireAuth: mocks.mockRequireAuth,
  requireDocumentOwner: vi.fn(),
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((_col, val) => ({ _eq: val })),
}));

import { updateUserPreferences } from "./user";

describe("updateUserPreferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.mockRequireAuth.mockResolvedValue({
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
    });

    mocks.mockUpdate.mockReturnValue({ set: mocks.mockSet });
    mocks.mockSet.mockReturnValue({ where: mocks.mockWhere });
    mocks.mockWhere.mockReturnValue({ returning: mocks.mockReturning });
    mocks.mockReturning.mockResolvedValue([
      {
        id: "user-1",
        aiProvider: "openai",
        aiModel: "gpt-5.2",
      },
    ]);
  });

  it("should persist ai_provider and ai_model to users table", async () => {
    const result = await updateUserPreferences({
      aiProvider: "openai",
      aiModel: "gpt-5.2",
    });

    expect(mocks.mockRequireAuth).toHaveBeenCalled();
    expect(mocks.mockUpdate).toHaveBeenCalled();
    expect(mocks.mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        aiProvider: "openai",
        aiModel: "gpt-5.2",
      })
    );
    expect(result).toHaveProperty("aiProvider", "openai");
    expect(result).toHaveProperty("aiModel", "gpt-5.2");
  });

  it("should require authentication before updating", async () => {
    mocks.mockRequireAuth.mockRejectedValue(new Error("Unauthorized"));

    await expect(
      updateUserPreferences({
        aiProvider: "anthropic",
        aiModel: "claude-sonnet-4-5-20250929",
      })
    ).rejects.toThrow("Unauthorized");

    expect(mocks.mockUpdate).not.toHaveBeenCalled();
  });
});
