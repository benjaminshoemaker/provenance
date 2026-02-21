import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAutoSave } from "./useAutoSave";

const mockUpdateDocument = vi.fn();

vi.mock("@/app/actions/documents", () => ({
  updateDocument: (...args: unknown[]) => mockUpdateDocument(...args),
}));

describe("useAutoSave", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockUpdateDocument.mockResolvedValue({ id: "doc-1" });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should debounce at 2 seconds and call updateDocument", async () => {
    const { result } = renderHook(() =>
      useAutoSave({ documentId: "doc-1", title: "Test" })
    );

    const content = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Hello world" }] },
      ],
    };

    // Trigger save
    act(() => {
      result.current.save(content);
    });

    // Should not have called yet (debounce)
    expect(mockUpdateDocument).not.toHaveBeenCalled();

    // Advance past debounce timeout (2 seconds)
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(mockUpdateDocument).toHaveBeenCalledWith("doc-1", {
      title: "Test",
      content,
      wordCount: 2,
    });
  });

  it("should show Saving status during save", async () => {
    const { result } = renderHook(() =>
      useAutoSave({ documentId: "doc-1", title: "Test" })
    );

    // Initially idle
    expect(result.current.status).toBe("idle");

    const content = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Hello" }] },
      ],
    };

    act(() => {
      result.current.save(content);
    });

    // After triggering save, should be debouncing
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    // After updateDocument resolves, status should be "saved"
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.status).toBe("saved");
  });

  it("should retry failed saves with exponential backoff up to 3 retries", async () => {
    mockUpdateDocument
      .mockRejectedValueOnce(new Error("Network error"))
      .mockRejectedValueOnce(new Error("Network error"))
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({ id: "doc-1" });

    const { result } = renderHook(() =>
      useAutoSave({ documentId: "doc-1", title: "Test" })
    );

    const content = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Hello" }] },
      ],
    };

    act(() => {
      result.current.save(content);
    });

    // Trigger initial save
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    // First retry after 1s
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Second retry after 2s
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    // Third retry after 4s
    await act(async () => {
      vi.advanceTimersByTime(4000);
    });

    // Should have attempted 4 calls total (1 initial + 3 retries)
    expect(mockUpdateDocument).toHaveBeenCalledTimes(4);
  });

  it("should set error status when all retries fail", async () => {
    mockUpdateDocument.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() =>
      useAutoSave({ documentId: "doc-1", title: "Test" })
    );

    const content = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Hello" }] },
      ],
    };

    act(() => {
      result.current.save(content);
    });

    // Trigger initial + all retries
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    await act(async () => {
      vi.advanceTimersByTime(4000);
    });

    expect(result.current.status).toBe("error");
  });

  it("should send full TipTap JSON content to updateDocument", async () => {
    const { result } = renderHook(() =>
      useAutoSave({ documentId: "doc-1", title: "My Title" })
    );

    const content = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "First paragraph" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Second paragraph" }],
        },
      ],
    };

    act(() => {
      result.current.save(content);
    });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(mockUpdateDocument).toHaveBeenCalledWith("doc-1", {
      title: "My Title",
      content,
      wordCount: 4,
    });
  });
});
