import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => {
  const mockReturning = vi.fn();
  const mockValues = vi.fn(() => ({ returning: mockReturning }));
  const mockWhere = vi.fn(() => ({ returning: mockReturning }));
  const mockSet = vi.fn(() => ({ where: mockWhere }));
  const mockInsert = vi.fn(() => ({ values: mockValues }));
  const mockUpdate = vi.fn(() => ({ set: mockSet }));
  const mockRequireAuth = vi.fn();
  const mockRequireDocumentOwner = vi.fn();

  return {
    mockInsert,
    mockUpdate,
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
  },
}));

vi.mock("@/lib/db/schema", () => ({
  writingSessions: {
    id: "id",
    documentId: "document_id",
    userId: "user_id",
    startedAt: "started_at",
    endedAt: "ended_at",
    activeSeconds: "active_seconds",
    lastHeartbeat: "last_heartbeat",
  },
}));

vi.mock("@/lib/auth/authorize", () => ({
  requireAuth: mocks.mockRequireAuth,
  requireDocumentOwner: mocks.mockRequireDocumentOwner,
}));

vi.mock("drizzle-orm", () => ({
  and: vi.fn((...conds: unknown[]) => ({ _and: conds })),
  eq: vi.fn((col: unknown, val: unknown) => ({ _eq: { col, val } })),
  sql: vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({
    _sql: strings.join("?"),
    _values: values,
  })),
}));

import { startSession, heartbeat, endSession } from "./sessions";

describe("startSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.mockRequireDocumentOwner.mockResolvedValue({
      user: { id: "user-1" },
      document: { id: "doc-1", userId: "user-1" },
    });

    mocks.mockInsert.mockReturnValue({ values: mocks.mockValues });
    mocks.mockValues.mockReturnValue({ returning: mocks.mockReturning });
    mocks.mockReturning.mockResolvedValue([
      {
        id: "session-1",
        documentId: "doc-1",
        userId: "user-1",
        startedAt: new Date(),
        endedAt: null,
        activeSeconds: 0,
        lastHeartbeat: new Date(),
      },
    ]);
  });

  it("should create a writing_sessions record", async () => {
    const result = await startSession("doc-1");

    expect(mocks.mockRequireDocumentOwner).toHaveBeenCalledWith("doc-1");
    expect(mocks.mockInsert).toHaveBeenCalled();
    expect(mocks.mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: "doc-1",
        userId: "user-1",
      })
    );
    expect(result).toHaveProperty("id", "session-1");
  });

  it("should require document ownership before creating a session", async () => {
    mocks.mockRequireDocumentOwner.mockRejectedValue(new Error("Forbidden"));

    await expect(startSession("doc-1")).rejects.toThrow("Forbidden");
    expect(mocks.mockInsert).not.toHaveBeenCalled();
  });
});

describe("heartbeat", () => {
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
        id: "session-1",
        activeSeconds: 30,
        lastHeartbeat: new Date(),
      },
    ]);
  });

  it("should update last_heartbeat and increment active_seconds", async () => {
    const result = await heartbeat("session-1");

    expect(mocks.mockRequireAuth).toHaveBeenCalled();
    expect(mocks.mockUpdate).toHaveBeenCalled();
    expect(mocks.mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        lastHeartbeat: expect.any(Date),
      })
    );
    expect(mocks.mockWhere).toHaveBeenCalledWith(
      expect.objectContaining({
        _and: expect.arrayContaining([
          { _eq: { col: "id", val: "session-1" } },
          { _eq: { col: "user_id", val: "user-1" } },
        ]),
      })
    );
    expect(result).toHaveProperty("id", "session-1");
  });

  it("should throw when session is not found or not owned by user", async () => {
    mocks.mockReturning.mockResolvedValue([]);

    await expect(heartbeat("session-1")).rejects.toThrow("Not found");
  });
});

describe("endSession", () => {
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
    mocks.mockReturning.mockResolvedValue([{ id: "session-1" }]);
  });

  it("should set ended_at timestamp", async () => {
    await endSession("session-1");

    expect(mocks.mockRequireAuth).toHaveBeenCalled();
    expect(mocks.mockUpdate).toHaveBeenCalled();
    expect(mocks.mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        endedAt: expect.any(Date),
      })
    );
    expect(mocks.mockWhere).toHaveBeenCalledWith(
      expect.objectContaining({
        _and: expect.arrayContaining([
          { _eq: { col: "id", val: "session-1" } },
          { _eq: { col: "user_id", val: "user-1" } },
        ]),
      })
    );
  });

  it("should throw when session is not found or not owned by user", async () => {
    mocks.mockReturning.mockResolvedValue([]);

    await expect(endSession("session-1")).rejects.toThrow("Not found");
  });
});
