import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TimelineMinimap } from "./TimelineMinimap";

describe("TimelineMinimap", () => {
  const defaultProps = {
    interactions: [
      { createdAt: "2025-01-15T10:05:00Z" },
      { createdAt: "2025-01-15T10:30:00Z" },
    ],
    pasteEvents: [
      { createdAt: "2025-01-15T10:15:00Z" },
    ],
    sessions: [
      { startedAt: "2025-01-15T10:00:00Z", endedAt: "2025-01-15T11:00:00Z" },
    ],
  };

  it("should render colored segments proportional to event timing", () => {
    const { container } = render(<TimelineMinimap {...defaultProps} />);

    const minimap = screen.getByTestId("timeline-minimap");
    expect(minimap).toBeDefined();

    // Should have colored segments
    expect(container.querySelector(".bg-emerald-500")).toBeTruthy();
    expect(container.querySelector(".bg-violet-500")).toBeTruthy();
    expect(container.querySelector(".bg-orange-500")).toBeTruthy();
  });

  it("should render legend with correct colors", () => {
    render(<TimelineMinimap {...defaultProps} />);

    expect(screen.getByText("Writing")).toBeDefined();
    expect(screen.getByText("AI")).toBeDefined();
    expect(screen.getByText("Paste")).toBeDefined();
  });

  it("should handle single session with no AI", () => {
    const { container } = render(
      <TimelineMinimap
        interactions={[]}
        pasteEvents={[]}
        sessions={[
          { startedAt: "2025-01-15T10:00:00Z", endedAt: "2025-01-15T11:00:00Z" },
        ]}
      />
    );

    const minimap = screen.getByTestId("timeline-minimap");
    expect(minimap).toBeDefined();
    expect(container.querySelector(".bg-emerald-500")).toBeTruthy();
  });

  it("should return null when no events have timestamps", () => {
    const { container } = render(
      <TimelineMinimap
        interactions={[]}
        pasteEvents={[]}
        sessions={[]}
      />
    );

    expect(container.querySelector("[data-testid='timeline-minimap']")).toBeNull();
  });
});
