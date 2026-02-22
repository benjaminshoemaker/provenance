import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AuditTimeline } from "./AuditTimeline";

const defaultProps = {
  interactions: [
    {
      mode: "inline",
      prompt: "Improve this text",
      response: "Improved text here",
      action: "accepted",
      createdAt: "2025-01-15T10:05:00Z",
    },
  ],
  pasteEvents: [
    {
      sourceType: "external",
      characterCount: 150,
      createdAt: "2025-01-15T10:10:00Z",
    },
  ],
  sessions: [
    {
      startedAt: "2025-01-15T10:00:00Z",
      endedAt: "2025-01-15T11:00:00Z",
      activeSeconds: 3600,
    },
  ],
  revisions: [
    { trigger: "autosave", createdAt: "2025-01-15T10:15:00Z" },
    { trigger: "autosave", createdAt: "2025-01-15T10:20:00Z" },
  ],
};

describe("AuditTimeline", () => {
  it("should render events grouped by session within day separators", () => {
    render(<AuditTimeline {...defaultProps} />);

    // Day separator should include Jan 15 date
    expect(screen.getAllByText(/Jan 15/).length).toBeGreaterThan(0);
  });

  it("should render AI interactions as expandable cards with violet styling", () => {
    const { container } = render(<AuditTimeline {...defaultProps} />);

    const violetDot = container.querySelector(".bg-violet-400");
    expect(violetDot).toBeTruthy();
  });

  it("should render paste events as compact rows with orange badge", () => {
    render(<AuditTimeline {...defaultProps} />);

    expect(screen.getByText("paste")).toBeDefined();
    expect(screen.getByText(/150 chars/)).toBeDefined();
  });

  it("should render filter chips with counts", () => {
    render(<AuditTimeline {...defaultProps} />);

    const filterChips = screen.getByTestId("filter-chips");
    expect(filterChips).toBeDefined();
    // Look within filter chips area
    expect(filterChips.textContent).toContain("AI");
    expect(filterChips.textContent).toContain("Paste");
    expect(filterChips.textContent).toContain("Revisions");
  });

  it("should filter events when filter chip is clicked", () => {
    const { container } = render(<AuditTimeline {...defaultProps} />);

    // Click AI filter within filter chips area
    const filterChips = screen.getByTestId("filter-chips");
    const aiChip = Array.from(filterChips.querySelectorAll("button")).find(
      (btn) => btn.textContent?.includes("AI") && !btn.textContent?.includes("All")
    )!;
    fireEvent.click(aiChip);

    // Paste events should not be visible
    expect(screen.queryByText("paste")).toBeNull();
  });

  it("should render badge landmark at timeline end", () => {
    render(<AuditTimeline {...defaultProps} />);

    expect(screen.getByTestId("badge-landmark")).toBeDefined();
    expect(screen.getByText("Badge Generated")).toBeDefined();
  });

  it("should show empty state when no events", () => {
    render(
      <AuditTimeline
        interactions={[]}
        pasteEvents={[]}
        sessions={[]}
        revisions={[]}
      />
    );

    expect(screen.getByText("No audit events recorded.")).toBeDefined();
  });

  it("should render timeline rail with colored dots", () => {
    const { container } = render(<AuditTimeline {...defaultProps} />);

    // Timeline rail
    expect(container.querySelector(".border-l-2")).toBeTruthy();
    // Colored dots
    expect(container.querySelector(".bg-violet-400")).toBeTruthy();
    expect(container.querySelector(".bg-orange-400")).toBeTruthy();
  });
});
