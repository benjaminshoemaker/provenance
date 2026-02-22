import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { TimelineModal } from "./TimelineModal";

const mockTimelineData = {
  interactions: [
    {
      mode: "inline",
      prompt: "Improve this",
      response: "Improved text",
      action: "accepted",
      createdAt: "2025-01-15T10:05:00Z",
    },
  ],
  pasteEvents: [],
  sessions: [
    {
      startedAt: "2025-01-15T10:00:00Z",
      endedAt: "2025-01-15T11:00:00Z",
      activeSeconds: 3600,
    },
  ],
  revisions: [],
};

describe("TimelineModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTimelineData),
    });
  });

  it("should not render when isOpen is false", () => {
    const { container } = render(
      <TimelineModal documentId="doc-1" isOpen={false} onClose={vi.fn()} />
    );
    expect(container.querySelector("[data-testid='timeline-modal']")).toBeNull();
  });

  it("should render modal with role=dialog when isOpen is true", async () => {
    await act(async () => {
      render(
        <TimelineModal documentId="doc-1" isOpen={true} onClose={vi.fn()} />
      );
    });

    const modal = screen.getByTestId("timeline-modal");
    expect(modal).toBeDefined();
    expect(modal.getAttribute("role")).toBe("dialog");
    expect(modal.getAttribute("aria-modal")).toBe("true");
    expect(screen.getByText("Document History")).toBeDefined();
  });

  it("should fetch timeline data and render AuditTimeline", async () => {
    await act(async () => {
      render(
        <TimelineModal documentId="doc-1" isOpen={true} onClose={vi.fn()} />
      );
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/documents/doc-1/timeline");
    });
  });

  it("should call onClose when close button clicked", async () => {
    const onClose = vi.fn();
    await act(async () => {
      render(
        <TimelineModal documentId="doc-1" isOpen={true} onClose={onClose} />
      );
    });

    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("should call onClose on Escape key", async () => {
    const onClose = vi.fn();
    await act(async () => {
      render(
        <TimelineModal documentId="doc-1" isOpen={true} onClose={onClose} />
      );
    });

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
