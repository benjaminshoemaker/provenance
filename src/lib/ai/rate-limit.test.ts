import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  mockExecute: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: { execute: mocks.mockExecute },
}));

import { checkRateLimit } from "./rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should allow when count is below limit", async () => {
    mocks.mockExecute.mockResolvedValue({ rows: [{ count: 5, inserted: true }] });
    const result = await checkRateLimit("user-1");
    expect(result.allowed).toBe(true);
  });

  it("should deny when count equals limit (20)", async () => {
    mocks.mockExecute.mockResolvedValue({ rows: [{ count: 20, inserted: false }] });
    const result = await checkRateLimit("user-1");
    expect(result.allowed).toBe(false);
  });

  it("should deny when count exceeds limit", async () => {
    mocks.mockExecute.mockResolvedValue({ rows: [{ count: 25, inserted: false }] });
    const result = await checkRateLimit("user-1");
    expect(result.allowed).toBe(false);
  });

  it("should allow at count 19 (one below limit)", async () => {
    mocks.mockExecute.mockResolvedValue({ rows: [{ count: 19, inserted: true }] });
    const result = await checkRateLimit("user-1");
    expect(result.allowed).toBe(true);
  });

  it("should use a single atomic SQL call", async () => {
    mocks.mockExecute.mockResolvedValue({ rows: [{ count: 1, inserted: true }] });
    await checkRateLimit("user-1");
    expect(mocks.mockExecute).toHaveBeenCalledTimes(1);
  });

  it("should fail closed when SQL result is missing", async () => {
    mocks.mockExecute.mockResolvedValue({ rows: [] });
    const result = await checkRateLimit("user-1");
    expect(result.allowed).toBe(false);
  });
});
