import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock TipTap
const mockEditor = {
  getJSON: vi.fn(() => ({ type: "doc", content: [] })),
  getHTML: vi.fn(() => "<p></p>"),
  getText: vi.fn(() => ""),
  commands: {
    setContent: vi.fn(),
  },
  isActive: vi.fn(() => false),
  chain: vi.fn(() => ({
    focus: vi.fn(() => ({
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
    sendMessage: vi.fn(),
    status: "ready",
    stop: vi.fn(),
    setMessages: vi.fn(),
    error: null,
  })),
}));

vi.mock("ai", () => ({
  DefaultChatTransport: vi.fn().mockImplementation(function (this: Record<string, unknown>, opts: Record<string, unknown>) { Object.assign(this, opts); }),
}));

vi.mock("@/app/actions/ai-interactions", () => ({
  logAIInteraction: vi.fn(),
}));

import { Editor } from "./Editor";
import { useEditor } from "@tiptap/react";

describe("Editor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
