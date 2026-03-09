import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BadgeList } from "./BadgeList";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("BadgeList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch badges for the current document", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            id: "badge-1",
            verificationId: "abc123def456ghi789012",
            stats: { typed_percentage: 88 },
            createdAt: "2026-02-21T00:00:00.000Z",
          },
        ]),
    });

    render(<BadgeList documentId="doc-1" />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/badges?documentId=doc-1"
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Badges (1)")).toBeTruthy();
    });
  });

  it("should render nothing when no badges exist", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const { container } = render(<BadgeList documentId="doc-1" />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    // After loading completes with empty result, should render null
    await waitFor(() => {
      expect(container.textContent).not.toContain("Badges");
    });
  });

  it("should show badge verification ID and copy buttons", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            id: "badge-1",
            verificationId: "abc123def456ghi789012",
            stats: { typed_percentage: 85 },
            createdAt: "2026-02-21T00:00:00.000Z",
          },
        ]),
    });

    render(<BadgeList documentId="doc-1" />);

    await waitFor(() => {
      expect(screen.getByText("abc123de...")).toBeTruthy();
      expect(screen.getByText("HTML")).toBeTruthy();
      expect(screen.getByText("MD")).toBeTruthy();
    });
  });
});
