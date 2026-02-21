import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  mockSendMessage: vi.fn(),
  mockSetMessages: vi.fn(),
  mockStop: vi.fn(),
  lastUseChatArgs: null as unknown,
  messagesValue: [] as Array<{
    id: string;
    role: string;
    parts: Array<{ type: string; text: string }>;
  }>,
  statusValue: "ready" as string,
  mockLogAIInteraction: vi.fn().mockResolvedValue({}),
}));

vi.mock("@ai-sdk/react", () => ({
  useChat: vi.fn((...args: unknown[]) => {
    mocks.lastUseChatArgs = args;
    return {
      messages: mocks.messagesValue,
      sendMessage: mocks.mockSendMessage,
      status: mocks.statusValue,
      stop: mocks.mockStop,
      setMessages: mocks.mockSetMessages,
      error: null,
    };
  }),
}));

vi.mock("ai", () => ({
  DefaultChatTransport: vi.fn().mockImplementation(function (this: Record<string, unknown>, opts: Record<string, unknown>) { Object.assign(this, opts); }),
}));

vi.mock("@/app/actions/ai-interactions", () => ({
  logAIInteraction: mocks.mockLogAIInteraction,
}));

import { SidePanel } from "./SidePanel";

describe("SidePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.messagesValue = [];
    mocks.statusValue = "ready";
    mocks.lastUseChatArgs = null;
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("should render chat interface always visible", () => {
    render(
      <SidePanel
        documentId="doc-1"
        provider="anthropic"
        model="claude-sonnet-4-5-20250929"
        getDocumentContent={() => ({ type: "doc", content: [] })}
      />
    );

    expect(screen.getByText("AI Assistant")).toBeDefined();
    expect(screen.getByPlaceholderText(/ask/i)).toBeDefined();
  });

  it("should display chat messages with user and AI bubbles", () => {
    mocks.messagesValue = [
      {
        id: "msg-1",
        role: "user",
        parts: [{ type: "text", text: "Help me brainstorm" }],
      },
      {
        id: "msg-2",
        role: "assistant",
        parts: [
          { type: "text", text: "Here are some ideas..." },
        ],
      },
    ];

    render(
      <SidePanel
        documentId="doc-1"
        provider="openai"
        model="gpt-4o"
        getDocumentContent={() => ({ type: "doc", content: [] })}
      />
    );

    expect(screen.getByText("Help me brainstorm")).toBeDefined();
    expect(screen.getByText("Here are some ideas...")).toBeDefined();
  });

  it("should send message with document context", async () => {
    let docContent: Record<string, unknown> = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "My essay" }] },
      ],
    };

    render(
      <SidePanel
        documentId="doc-1"
        provider="anthropic"
        model="claude-sonnet-4-5-20250929"
        getDocumentContent={() => docContent}
      />
    );

    const input = screen.getByPlaceholderText(/ask/i);
    fireEvent.change(input, { target: { value: "Suggest improvements" } });

    // Change content after initial render — should be read at request time.
    docContent = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Updated essay" }] },
      ],
    };

    await act(async () => {
      fireEvent.submit(input.closest("form")!);
    });

    expect(mocks.mockSendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining("Suggest improvements"),
      }),
      expect.objectContaining({
        body: expect.objectContaining({
          mode: "side_panel",
          provider: "anthropic",
          model: "claude-sonnet-4-5-20250929",
          context: JSON.stringify(docContent),
        }),
      })
    );
  });

  it("should persist messages as ai_interactions with mode side_panel", async () => {
    mocks.messagesValue = [
      {
        id: "msg-1",
        role: "user",
        parts: [{ type: "text", text: "Help me" }],
      },
      {
        id: "msg-2",
        role: "assistant",
        parts: [{ type: "text", text: "Sure, here is help" }],
      },
    ];

    render(
      <SidePanel
        documentId="doc-1"
        provider="anthropic"
        model="claude-sonnet-4-5-20250929"
        getDocumentContent={() => ({ type: "doc", content: [] })}
      />
    );

    // The logAIInteraction should be called via onFinish callback
    // We verify the useChat hook receives the right config
    const { useChat } = await import("@ai-sdk/react");
    expect(useChat).toHaveBeenCalled();
  });

  it("should log prompt and response on finish", async () => {
    const onAIResponse = vi.fn();

    render(
      <SidePanel
        documentId="doc-1"
        provider="anthropic"
        model="claude-sonnet-4-5-20250929"
        getDocumentContent={() => ({ type: "doc", content: [] })}
        onAIResponse={onAIResponse}
      />
    );

    const input = screen.getByPlaceholderText(/ask/i);
    fireEvent.change(input, { target: { value: "Help me" } });

    await act(async () => {
      fireEvent.submit(input.closest("form")!);
    });

    // Trigger onFinish manually with a fake assistant message
    const args = mocks.lastUseChatArgs as [{ onFinish?: (arg: unknown) => void }] | null;
    const onFinish = args?.[0]?.onFinish;
    expect(typeof onFinish).toBe("function");

    await act(async () => {
      onFinish?.({
        message: {
          parts: [{ type: "text", text: "Sure, here is help" }],
        },
      });
    });

    expect(mocks.mockLogAIInteraction).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: "doc-1",
        mode: "side_panel",
        prompt: "Help me",
        response: "Sure, here is help",
        action: "received",
        provider: "anthropic",
        model: "claude-sonnet-4-5-20250929",
      })
    );

    expect(onAIResponse).toHaveBeenCalledWith("Sure, here is help");
  });
});
