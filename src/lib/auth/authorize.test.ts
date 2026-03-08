import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const mockAuth = vi.fn();
  const mockSelectWhere = vi.fn();
  const mockSelectFrom = vi.fn(() => ({ where: mockSelectWhere }));
  const mockSelect = vi.fn(() => ({ from: mockSelectFrom }));

  return {
    mockAuth,
    mockSelect,
    mockSelectFrom,
    mockSelectWhere,
  };
});

vi.mock("@/auth", () => ({
  auth: mocks.mockAuth,
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: mocks.mockSelect,
  },
}));

vi.mock("@/lib/db/schema", () => ({
  users: {
    id: "id",
    email: "email",
    name: "name",
    image: "image",
  },
  documents: {
    id: "id",
    userId: "user_id",
    deletedAt: "deleted_at",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((column, value) => ({ column, value })),
  and: vi.fn((...conditions) => conditions),
  isNull: vi.fn((column) => ({ isNull: column })),
}));

import { requireAuth } from "./authorize";

describe("requireAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.mockAuth.mockResolvedValue({
      user: {
        id: "user-1",
        email: "writer@example.com",
        name: "Writer",
        image: "https://example.com/avatar.png",
      },
    });
  });

  it("should return the existing user when the session id exists in the database", async () => {
    mocks.mockSelectWhere.mockResolvedValueOnce([
      {
        id: "user-1",
        email: "writer@example.com",
        name: "Writer",
        image: "https://example.com/avatar.png",
      },
    ]);

    const user = await requireAuth();

    expect(user.id).toBe("user-1");
    expect(user.email).toBe("writer@example.com");
  });

  it("should fall back to the canonical user when the session id is stale but the email exists", async () => {
    mocks.mockSelectWhere
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "user-2",
          email: "writer@example.com",
          name: "Canonical Writer",
          image: null,
        },
      ]);

    const user = await requireAuth();

    expect(user.id).toBe("user-2");
    expect(user.name).toBe("Canonical Writer");
  });

  it("should throw when the session is valid but the database has no matching record", async () => {
    mocks.mockSelectWhere
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    await expect(requireAuth()).rejects.toThrow("Unauthorized");
  });

  it("should throw when there is no authenticated session id", async () => {
    mocks.mockAuth.mockResolvedValueOnce({ user: { email: "writer@example.com" } });

    await expect(requireAuth()).rejects.toThrow("Unauthorized");
  });

  it("should throw when the session user is missing an email and no database row exists", async () => {
    mocks.mockAuth.mockResolvedValueOnce({
      user: {
        id: "user-1",
        email: null,
        name: "Writer",
        image: null,
      },
    });
    mocks.mockSelectWhere.mockResolvedValueOnce([]);

    await expect(requireAuth()).rejects.toThrow("Unauthorized");
  });
});
