import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock react-resizable-panels
vi.mock("react-resizable-panels", () => ({
  usePanelRef: vi.fn(() => ({ current: null })),
  useDefaultLayout: vi.fn(() => ({
    defaultLayout: undefined,
    onLayoutChanged: vi.fn(),
  })),
}));

// Mock resizable UI components
vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <div data-testid="panel-group" {...props}>
      {children}
    </div>
  ),
  ResizablePanel: ({
    children,
    id,
    ...props
  }: {
    children: React.ReactNode;
    id?: string;
    [key: string]: unknown;
  }) => (
    <div data-testid={`panel-${id}`} {...props}>
      {children}
    </div>
  ),
  ResizableHandle: (props: { withHandle?: boolean }) => (
    <div data-testid="resize-handle" {...props} />
  ),
}));

// Mock tooltip
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

import { PanelLayout } from "./PanelLayout";

describe("PanelLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("should render editor and AI chat panels", () => {
    render(
      <PanelLayout
        editorContent={<div>Editor Content</div>}
        aiChatContent={<div>AI Chat Content</div>}
      />
    );

    expect(screen.getByText("Editor Content")).toBeDefined();
    expect(screen.getByText("AI Chat Content")).toBeDefined();
  });

  it("should render the activity bar", () => {
    render(
      <PanelLayout
        editorContent={<div>Editor</div>}
        aiChatContent={<div>Chat</div>}
      />
    );

    expect(screen.getByRole("toolbar")).toBeDefined();
  });

  it("should render the resize handle", () => {
    render(
      <PanelLayout
        editorContent={<div>Editor</div>}
        aiChatContent={<div>Chat</div>}
      />
    );

    expect(screen.getByTestId("resize-handle")).toBeDefined();
  });

  it("should render freeform content when provided", () => {
    render(
      <PanelLayout
        editorContent={<div>Editor</div>}
        aiChatContent={<div>Chat</div>}
        freeformContent={<div>Freeform AI</div>}
      />
    );

    expect(screen.getByText("Freeform AI")).toBeDefined();
  });

  it("should toggle panel state via activity bar buttons", () => {
    render(
      <PanelLayout
        editorContent={<div>Editor</div>}
        aiChatContent={<div>Chat</div>}
      />
    );

    const buttons = screen.getAllByRole("button");
    // Initially both panels are open
    expect(buttons[0].getAttribute("aria-pressed")).toBe("true");
    expect(buttons[1].getAttribute("aria-pressed")).toBe("true");

    // Toggle AI chat off
    fireEvent.click(buttons[1]);
    expect(buttons[1].getAttribute("aria-pressed")).toBe("false");

    // Toggle AI chat back on
    fireEvent.click(buttons[1]);
    expect(buttons[1].getAttribute("aria-pressed")).toBe("true");
  });

  it("should toggle panels via keyboard shortcuts", () => {
    render(
      <PanelLayout
        editorContent={<div>Editor</div>}
        aiChatContent={<div>Chat</div>}
      />
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons[0].getAttribute("aria-pressed")).toBe("true");

    // Cmd+Shift+1 toggles editor
    fireEvent.keyDown(window, {
      key: "!",
      code: "Digit1",
      metaKey: true,
      shiftKey: true,
    });
    expect(buttons[0].getAttribute("aria-pressed")).toBe("false");

    // Cmd+Shift+2 toggles AI chat
    fireEvent.keyDown(window, {
      key: "@",
      code: "Digit2",
      metaKey: true,
      shiftKey: true,
    });
    expect(buttons[1].getAttribute("aria-pressed")).toBe("false");
  });

  it("should render panel element ids for aria-controls", () => {
    render(
      <PanelLayout
        editorContent={<div>Editor</div>}
        aiChatContent={<div>Chat</div>}
      />
    );

    expect(document.getElementById("panel-editor")).not.toBeNull();
    expect(document.getElementById("panel-ai-chat")).not.toBeNull();
  });
});
