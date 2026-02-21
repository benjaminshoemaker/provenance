import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ActivityBar, PANEL_ITEMS } from "./ActivityBar";

// Mock TooltipProvider context — tooltips need a provider
vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({
    children,
    asChild,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => (asChild ? <>{children}</> : <span>{children}</span>),
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <div role="tooltip">{children}</div>
  ),
}));

describe("ActivityBar", () => {
  const mockOnToggle = vi.fn();
  const defaultProps = {
    isPanelOpen: (id: string) => id === "editor",
    onToggle: mockOnToggle,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render icon buttons for each panel item", () => {
    render(<ActivityBar {...defaultProps} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(PANEL_ITEMS.length);
  });

  it("should render with toolbar role", () => {
    render(<ActivityBar {...defaultProps} />);

    expect(screen.getByRole("toolbar")).toBeDefined();
  });

  it("should set aria-pressed based on panel open state", () => {
    render(<ActivityBar {...defaultProps} />);

    const buttons = screen.getAllByRole("button");
    // Editor is open
    expect(buttons[0].getAttribute("aria-pressed")).toBe("true");
    // AI chat is closed
    expect(buttons[1].getAttribute("aria-pressed")).toBe("false");
  });

  it("should set aria-controls on each button", () => {
    render(<ActivityBar {...defaultProps} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons[0].getAttribute("aria-controls")).toBe("panel-editor");
    expect(buttons[1].getAttribute("aria-controls")).toBe("panel-ai-chat");
  });

  it("should call onToggle with panel id when clicked", () => {
    render(<ActivityBar {...defaultProps} />);

    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[1]);

    expect(mockOnToggle).toHaveBeenCalledWith("ai-chat");
  });

  it("should render tooltips with panel labels", () => {
    render(<ActivityBar {...defaultProps} />);

    // Label appears in both sr-only span and tooltip
    expect(screen.getAllByText(/Editor/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/AI Chat/).length).toBeGreaterThanOrEqual(1);
  });
});
