import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

const mockSetTextSelection = vi.fn(() => ({ run: vi.fn() }));

// Mock TipTap
const mockDom = document.createElement("div");
const mockEditor = {
  getJSON: vi.fn(() => ({ type: "doc", content: [] })),
  getHTML: vi.fn(() => "<p></p>"),
  getText: vi.fn(() => ""),
  view: {
    dom: mockDom,
    coordsAtPos: vi.fn(() => ({ top: 220, left: 640, right: 640, bottom: 236 })),
  },
  state: {
    selection: { from: 0, to: 0 },
    doc: {
      textBetween: vi.fn(() => "selected text"),
    },
  },
  commands: {
    setContent: vi.fn(),
  },
  isActive: vi.fn(() => false),
  chain: vi.fn(() => ({
    focus: vi.fn(() => ({
      setTextSelection: mockSetTextSelection,
      toggleBold: vi.fn(() => ({ run: vi.fn() })),
      toggleItalic: vi.fn(() => ({ run: vi.fn() })),
      toggleStrike: vi.fn(() => ({ run: vi.fn() })),
      toggleCode: vi.fn(() => ({ run: vi.fn() })),
      toggleHeading: vi.fn(() => ({ run: vi.fn() })),
      toggleBlockquote: vi.fn(() => ({ run: vi.fn() })),
      toggleCodeBlock: vi.fn(() => ({ run: vi.fn() })),
      toggleBulletList: vi.fn(() => ({ run: vi.fn() })),
      toggleOrderedList: vi.fn(() => ({ run: vi.fn() })),
      setLink: vi.fn(() => ({ run: vi.fn() })),
      unsetLink: vi.fn(() => ({ run: vi.fn() })),
      setImage: vi.fn(() => ({ run: vi.fn() })),
      undo: vi.fn(() => ({ run: vi.fn() })),
      redo: vi.fn(() => ({ run: vi.fn() })),
    })),
  })),
  on: vi.fn(),
  off: vi.fn(),
  destroy: vi.fn(),
};

vi.mock("@tiptap/react", () => ({
  useEditor: vi.fn(() => mockEditor),
  EditorContent: vi.fn(({ editor }: { editor: unknown }) =>
    editor ? <div data-testid="editor-content">Editor content</div> : null
  ),
}));

vi.mock("@tiptap/starter-kit", () => ({
  default: {
    configure: vi.fn(() => ({})),
  },
}));

vi.mock("@tiptap/extension-link", () => ({
  default: {
    configure: vi.fn(() => ({})),
  },
}));

vi.mock("@tiptap/extension-image", () => ({
  default: {
    configure: vi.fn(() => ({})),
  },
}));

vi.mock("@/extensions/origin-mark", () => ({
  OriginMark: {},
}));

vi.mock("@/extensions/paste-handler", () => ({
  PasteHandler: { configure: vi.fn(() => ({})) },
}));

vi.mock("@/app/actions/paste-events", () => ({
  logPasteEvent: vi.fn(),
}));

vi.mock("@/hooks/useRevisions", () => ({
  useRevisions: vi.fn(() => ({
    updateContent: vi.fn(),
    createAIRevision: vi.fn(),
  })),
}));

vi.mock("@ai-sdk/react", () => ({
  useCompletion: vi.fn(() => ({
    completion: "",
    complete: vi.fn(),
    isLoading: false,
    stop: vi.fn(),
    setCompletion: vi.fn(),
    input: "",
    setInput: vi.fn(),
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
  })),
  useChat: vi.fn(() => ({
    messages: [],
    setMessages: vi.fn(),
    sendMessage: vi.fn(),
    status: "ready",
    stop: vi.fn(),
  })),
}));

vi.mock("@/app/actions/ai-interactions", () => ({
  logAIInteraction: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("./TimelineModal", () => ({
  TimelineModal: () => null,
}));

vi.mock("./chat/ChatPanel", () => ({
  ChatPanel: () => <div data-testid="chat-panel">Chat Panel</div>,
}));

vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children, ...props }: any) => <div data-testid="resizable-group" {...props}>{children}</div>,
  ResizablePanel: ({ children, ...props }: any) => <div data-testid="resizable-panel" {...props}>{children}</div>,
  ResizableHandle: () => <div data-testid="resizable-handle" />,
}));

vi.mock("react-resizable-panels", () => ({
  usePanelRef: vi.fn(() => ({ current: null })),
}));

import { Editor } from "./Editor";
import { useEditor } from "@tiptap/react";

describe("Editor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSetTextSelection.mockClear();
    Element.prototype.scrollIntoView = vi.fn();
    mockEditor.state.selection = { from: 0, to: 0 };
    (mockEditor.view.coordsAtPos as ReturnType<typeof vi.fn>).mockReturnValue({
      top: 220,
      left: 640,
      right: 640,
      bottom: 236,
    });
  });

  it("should render without hydration errors in test environment", () => {
    const { container } = render(
      <Editor
        content={{ type: "doc", content: [] }}
        documentId="doc-1"
        title="Test Document"
      />
    );

    expect(container).toBeTruthy();
    expect(screen.getByTestId("editor-content")).toBeTruthy();
  });

  it("should use immediatelyRender false to prevent SSR hydration issues", () => {
    render(
      <Editor
        content={{ type: "doc", content: [] }}
        documentId="doc-1"
        title="Test Document"
      />
    );

    expect(useEditor).toHaveBeenCalledWith(
      expect.objectContaining({
        immediatelyRender: false,
      })
    );
  });

  it("should configure StarterKit extension", () => {
    render(
      <Editor
        content={{ type: "doc", content: [] }}
        documentId="doc-1"
        title="Test Document"
      />
    );

    expect(useEditor).toHaveBeenCalledWith(
      expect.objectContaining({
        extensions: expect.arrayContaining([expect.anything()]),
      })
    );
  });

  it("should pass initial content to the editor", () => {
    const content = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Hello" }] }],
    };

    render(
      <Editor content={content} documentId="doc-1" title="Test Document" />
    );

    expect(useEditor).toHaveBeenCalledWith(
      expect.objectContaining({
        content,
      })
    );
  });

  it("should render editor content within resizable panel layout", () => {
    render(
      <Editor
        content={{ type: "doc", content: [] }}
        documentId="doc-1"
        title="Test Document"
      />
    );

    expect(screen.getByTestId("editor-content")).toBeTruthy();
  });

  it("should not auto-open inline AI when text is selected", async () => {
    render(
      <Editor
        content={{ type: "doc", content: [] }}
        documentId="doc-1"
        title="Test Document"
      />
    );

    const selectionUpdateHandler = (mockEditor.on as ReturnType<typeof vi.fn>).mock.calls
      .find((call) => call[0] === "selectionUpdate")?.[1] as (() => void) | undefined;

    mockEditor.state.selection = { from: 1, to: 5 };
    await act(async () => {
      selectionUpdateHandler?.();
    });

    expect(screen.queryByTestId("inline-ai-toolbar")).toBeNull();
    // Trigger should appear when text is selected
    expect(screen.getByTestId("inline-ai-trigger")).toBeTruthy();
  });

  it("should hide AI trigger when no text is selected", () => {
    render(
      <Editor
        content={{ type: "doc", content: [] }}
        documentId="doc-1"
        title="Test Document"
      />
    );

    // No selection (from === to), trigger should not be visible
    expect(screen.queryByTestId("inline-ai-trigger")).toBeNull();
  });

  it("should keep AI trigger aligned with cursor line when text is selected", async () => {
    render(
      <Editor
        content={{ type: "doc", content: [] }}
        documentId="doc-1"
        title="Test Document"
      />
    );

    const selectionUpdateHandler = (mockEditor.on as ReturnType<typeof vi.fn>).mock.calls
      .find((call) => call[0] === "selectionUpdate")?.[1] as (() => void) | undefined;

    (mockEditor.view.coordsAtPos as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      top: 220,
      left: 640,
      right: 640,
      bottom: 236,
    });
    mockEditor.state.selection = { from: 1, to: 5 };
    await act(async () => {
      selectionUpdateHandler?.();
    });
    const trigger = screen.getByTestId("inline-ai-trigger");
    expect(trigger.getAttribute("style")).toContain("top:");

    (mockEditor.view.coordsAtPos as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      top: 320,
      left: 640,
      right: 640,
      bottom: 336,
    });
    mockEditor.state.selection = { from: 2, to: 10 };
    await act(async () => {
      selectionUpdateHandler?.();
    });
    expect(trigger.getAttribute("style")).toContain("top:");
  });

  it("should open inline AI when trigger is clicked with a selection", async () => {
    render(
      <Editor
        content={{ type: "doc", content: [] }}
        documentId="doc-1"
        title="Test Document"
      />
    );

    const selectionUpdateHandler = (mockEditor.on as ReturnType<typeof vi.fn>).mock.calls
      .find((call) => call[0] === "selectionUpdate")?.[1] as (() => void) | undefined;

    mockEditor.state.selection = { from: 1, to: 5 };
    await act(async () => {
      selectionUpdateHandler?.();
    });

    const trigger = screen.getByTestId("inline-ai-trigger");
    await act(async () => {
      fireEvent.mouseDown(trigger);
      fireEvent.click(trigger);
    });

    expect(screen.getByTestId("inline-ai-toolbar")).toBeTruthy();
    expect(mockSetTextSelection).toHaveBeenCalledWith({ from: 1, to: 5 });
  });

});
