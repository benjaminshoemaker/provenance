import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAuth = vi.fn();
const mockDbSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();

vi.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: (table: unknown) => {
        mockFrom(table);
        return { where: (cond: unknown) => { mockWhere(cond); return mockDbSelect(); } };
      },
    }),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  documents: "documents",
  aiInteractions: "aiInteractions",
  pasteEvents: "pasteEvents",
  writingSessions: "writingSessions",
  revisions: "revisions",
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => args),
  and: vi.fn((...args: unknown[]) => args),
  isNull: vi.fn((arg: unknown) => arg),
}));

import { GET } from "./route";

const validUuid = "550e8400-e29b-41d4-a716-446655440000";

describe("GET /api/documents/[id]/timeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 404 for invalid UUID", async () => {
    const request = new Request("http://localhost/api/documents/invalid/timeline");
    const res = await GET(request, { params: Promise.resolve({ id: "invalid" }) });

    expect(res.status).toBe(404);
  });

  it("should return 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const request = new Request(`http://localhost/api/documents/${validUuid}/timeline`);
    const res = await GET(request, { params: Promise.resolve({ id: validUuid }) });

    expect(res.status).toBe(401);
  });

  it("should return 404 when document not found", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockDbSelect.mockResolvedValueOnce([]); // documents query returns empty

    const request = new Request(`http://localhost/api/documents/${validUuid}/timeline`);
    const res = await GET(request, { params: Promise.resolve({ id: validUuid }) });

    expect(res.status).toBe(404);
  });

  it("should return 404 when document belongs to different user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockDbSelect.mockResolvedValueOnce([{ id: validUuid, userId: "user-2" }]);

    const request = new Request(`http://localhost/api/documents/${validUuid}/timeline`);
    const res = await GET(request, { params: Promise.resolve({ id: validUuid }) });

    expect(res.status).toBe(404);
  });

  it("should return timeline data for authenticated document owner", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockDbSelect
      .mockResolvedValueOnce([{ id: validUuid, userId: "user-1" }]) // document
      .mockResolvedValueOnce([{ mode: "inline", prompt: "test", response: "r", action: "accepted", createdAt: "2025-01-01" }]) // interactions
      .mockResolvedValueOnce([]) // pasteEvents
      .mockResolvedValueOnce([]) // sessions
      .mockResolvedValueOnce([]); // revisions

    const request = new Request(`http://localhost/api/documents/${validUuid}/timeline`);
    const res = await GET(request, { params: Promise.resolve({ id: validUuid }) });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.interactions).toHaveLength(1);
    expect(data.pasteEvents).toHaveLength(0);
    expect(data.sessions).toHaveLength(0);
    expect(data.revisions).toHaveLength(0);
  });

  it("should set private cache control headers", async () => {
    mockAuth.mockResolvedValue(null);

    const request = new Request(`http://localhost/api/documents/${validUuid}/timeline`);
    const res = await GET(request, { params: Promise.resolve({ id: validUuid }) });

    expect(res.headers.get("Cache-Control")).toBe("private, no-store, max-age=0");
  });
});
