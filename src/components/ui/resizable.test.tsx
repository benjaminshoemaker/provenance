import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ResizableHandle } from "./resizable";

// Mock react-resizable-panels Separator to render a simple div
vi.mock("react-resizable-panels", () => ({
  Separator: ({ children, className, ...props }: any) => (
    <div data-testid="separator" className={className} {...props}>
      {children}
    </div>
  ),
}));

describe("ResizableHandle", () => {
  it("should render grip handle when withHandle is true", () => {
    render(<ResizableHandle withHandle />);
    expect(screen.getByTestId("separator")).toBeTruthy();
  });

  it("should not render chevron button when onCollapseToggle is not provided", () => {
    render(<ResizableHandle withHandle />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("should render chevron button when onCollapseToggle is provided", () => {
    render(
      <ResizableHandle
        withHandle
        onCollapseToggle={vi.fn()}
        collapseDirection="right"
        isCollapsed={false}
        collapseLabel="AI Chat"
      />
    );
    expect(screen.getByRole("button")).toBeTruthy();
  });

  it("should show Collapse label when not collapsed", () => {
    render(
      <ResizableHandle
        withHandle
        onCollapseToggle={vi.fn()}
        collapseDirection="right"
        isCollapsed={false}
        collapseLabel="AI Chat"
      />
    );
    expect(screen.getByLabelText("Collapse AI Chat")).toBeTruthy();
  });

  it("should show Expand label when collapsed", () => {
    render(
      <ResizableHandle
        withHandle
        onCollapseToggle={vi.fn()}
        collapseDirection="right"
        isCollapsed={true}
        collapseLabel="AI Chat"
      />
    );
    expect(screen.getByLabelText("Expand AI Chat")).toBeTruthy();
  });

  it("should have aria-expanded=true when not collapsed", () => {
    render(
      <ResizableHandle
        withHandle
        onCollapseToggle={vi.fn()}
        collapseDirection="right"
        isCollapsed={false}
        collapseLabel="AI Chat"
      />
    );
    expect(screen.getByRole("button").getAttribute("aria-expanded")).toBe("true");
  });

  it("should have aria-expanded=false when collapsed", () => {
    render(
      <ResizableHandle
        withHandle
        onCollapseToggle={vi.fn()}
        collapseDirection="right"
        isCollapsed={true}
        collapseLabel="AI Chat"
      />
    );
    expect(screen.getByRole("button").getAttribute("aria-expanded")).toBe("false");
  });

  it("should call onCollapseToggle when chevron button is clicked", () => {
    const toggle = vi.fn();
    render(
      <ResizableHandle
        withHandle
        onCollapseToggle={toggle}
        collapseDirection="right"
        isCollapsed={false}
        collapseLabel="AI Chat"
      />
    );
    fireEvent.click(screen.getByRole("button"));
    expect(toggle).toHaveBeenCalledTimes(1);
  });

  it("should stop propagation on pointer down to prevent drag", () => {
    render(
      <ResizableHandle
        withHandle
        onCollapseToggle={vi.fn()}
        collapseDirection="right"
        isCollapsed={false}
        collapseLabel="AI Chat"
      />
    );
    const button = screen.getByRole("button");
    const event = new MouseEvent("pointerdown", { bubbles: true, cancelable: true });
    const stopPropagation = vi.spyOn(event, "stopPropagation");
    button.dispatchEvent(event);
    expect(stopPropagation).toHaveBeenCalled();
  });
});
