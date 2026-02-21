import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSession } from "./useSession";

const mockStartSession = vi.fn();
const mockHeartbeat = vi.fn();
const mockEndSession = vi.fn();

vi.mock("@/app/actions/sessions", () => ({
  startSession: (...args: unknown[]) => mockStartSession(...args),
  heartbeat: (...args: unknown[]) => mockHeartbeat(...args),
  endSession: (...args: unknown[]) => mockEndSession(...args),
}));

describe("useSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockStartSession.mockResolvedValue({ id: "session-1" });
    mockHeartbeat.mockResolvedValue({ id: "session-1", activeSeconds: 30 });
    mockEndSession.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should start session on mount", async () => {
    renderHook(() => useSession({ documentId: "doc-1" }));

    // Flush microtasks (the async init() inside useEffect)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(mockStartSession).toHaveBeenCalledWith("doc-1");
  });

  it("should send heartbeats every 30s while active", async () => {
    const { result } = renderHook(() =>
      useSession({
        documentId: "doc-1",
        heartbeatIntervalMs: 30000,
        activityTimeoutMs: 60000,
      })
    );

    // Wait for session start
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // Mark user as active (resets lastActivity to Date.now())
    act(() => {
      result.current.markActive();
    });

    // Advance 30 seconds — should trigger heartbeat
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30000);
    });

    expect(mockHeartbeat).toHaveBeenCalledWith("session-1");
  });

  it("should end session on unmount", async () => {
    const { unmount } = renderHook(() =>
      useSession({ documentId: "doc-1" })
    );

    // Wait for session start
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // Unmount triggers endSession
    unmount();

    expect(mockEndSession).toHaveBeenCalledWith("session-1");
  });

  it("should not send heartbeat when inactive for more than 60 seconds", async () => {
    renderHook(() =>
      useSession({
        documentId: "doc-1",
        heartbeatIntervalMs: 30000,
        activityTimeoutMs: 60000,
      })
    );

    // Wait for session start
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // lastActivity is set to Date.now() at mount, so user is "active" initially.
    // The first heartbeat at 30s will fire (user still within 60s window).
    // Advance past the activity timeout (61s) so user becomes inactive.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(61000);
    });

    // Clear any heartbeat calls that happened while active (at 30s mark)
    mockHeartbeat.mockClear();

    // Now advance another 30s — next heartbeat interval fires but user is inactive
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30000);
    });

    // Heartbeat should NOT be called when inactive
    expect(mockHeartbeat).not.toHaveBeenCalled();
  });
});
