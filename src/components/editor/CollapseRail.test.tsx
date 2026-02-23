import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CollapseRail } from "./CollapseRail";

describe("CollapseRail", () => {
  it("should render label text", () => {
    render(<CollapseRail label="Editor" onClick={vi.fn()} />);
    expect(screen.getByText("Editor")).toBeTruthy();
  });

  it("should render label with shortcut when provided", () => {
    render(<CollapseRail label="AI Chat" shortcut="⌘L" onClick={vi.fn()} />);
    expect(screen.getByText(/AI Chat/)).toBeTruthy();
    expect(screen.getByText(/⌘L/)).toBeTruthy();
  });

  it("should call onClick when clicked", () => {
    const onClick = vi.fn();
    render(<CollapseRail label="Editor" onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("should call onClick on Enter key", () => {
    const onClick = vi.fn();
    render(<CollapseRail label="Editor" onClick={onClick} />);
    fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("should call onClick on Space key", () => {
    const onClick = vi.fn();
    render(<CollapseRail label="Editor" onClick={onClick} />);
    fireEvent.keyDown(screen.getByRole("button"), { key: " " });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("should have correct aria-label", () => {
    render(<CollapseRail label="AI Chat" onClick={vi.fn()} />);
    expect(screen.getByLabelText("Expand AI Chat panel")).toBeTruthy();
  });

  it("should be focusable via tabIndex", () => {
    render(<CollapseRail label="Editor" onClick={vi.fn()} />);
    const button = screen.getByRole("button");
    expect(button.getAttribute("tabindex")).toBe("0");
  });
});
