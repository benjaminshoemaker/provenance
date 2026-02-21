import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAutoSave } from "./useAutoSave";

const mockUpdateDocument = vi.fn();

vi.mock("@/app/actions/documents", () => ({
  updateDocument: (...args: unknown[]) => mockUpdateDocument(...args),
}));

const content = {
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "Hello world" }] },
  ],
};

describe("useAutoSave", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockUpdateDocument.mockResolvedValue({ id: "doc-1" });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should debounce at 1 second and call updateDocument", async () => {
    const { result } = renderHook(() =>
      useAutoSave({ documentId: "doc-1", title: "Test" })
    );

    act(() => {
      result.current.save(content);
    });

    expect(mockUpdateDocument).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1000);
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

    expect(result.current.status).toBe("idle");

    act(() => {
      result.current.save(content);
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

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

    act(() => {
      result.current.save(content);
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
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

    expect(mockUpdateDocument).toHaveBeenCalledTimes(4);
  });

  it("should set error status when all retries fail", async () => {
    mockUpdateDocument.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() =>
      useAutoSave({ documentId: "doc-1", title: "Test" })
    );

    act(() => {
      result.current.save(content);
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
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

    const multiParagraph = {
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
      result.current.save(multiParagraph);
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockUpdateDocument).toHaveBeenCalledWith("doc-1", {
      title: "My Title",
      content: multiParagraph,
      wordCount: 4,
    });
  });

  it("should set isDirty when save is called and clear after save completes", async () => {
    const { result } = renderHook(() =>
      useAutoSave({ documentId: "doc-1", title: "Test" })
    );

    expect(result.current.isDirty).toBe(false);

    act(() => {
      result.current.save(content);
    });

    expect(result.current.isDirty).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.isDirty).toBe(false);
  });

  it("should trigger save when title changes and content exists", async () => {
    const { result, rerender } = renderHook(
      ({ title }) => useAutoSave({ documentId: "doc-1", title }),
      { initialProps: { title: "Original" } }
    );

    // First, save some content so lastContentRef is populated
    act(() => {
      result.current.save(content);
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    mockUpdateDocument.mockClear();

    // Change the title
    rerender({ title: "Updated Title" });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockUpdateDocument).toHaveBeenCalledWith("doc-1", {
      title: "Updated Title",
      content,
      wordCount: 2,
    });
  });
});
