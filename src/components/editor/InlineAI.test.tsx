import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  mockComplete: vi.fn(),
  mockStop: vi.fn(),
  mockSetCompletion: vi.fn(),
  mockLogAIInteraction: vi.fn().mockResolvedValue({}),
  completionValue: "",
  isLoadingValue: false,
}));

vi.mock("@ai-sdk/react", () => ({
  useCompletion: vi.fn(() => ({
    completion: mocks.completionValue,
    complete: mocks.mockComplete,
    isLoading: mocks.isLoadingValue,
    stop: mocks.mockStop,
    setCompletion: mocks.mockSetCompletion,
    input: "",
    setInput: vi.fn(),
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
  })),
}));

vi.mock("@/app/actions/ai-interactions", () => ({
  logAIInteraction: mocks.mockLogAIInteraction,
}));

vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "mock-nanoid-123"),
}));

import { InlineAI } from "./InlineAI";

function createMockEditor() {
  const chainObj: Record<string, ReturnType<typeof vi.fn>> = {};
  chainObj.focus = vi.fn(() => chainObj);
  chainObj.insertContentAt = vi.fn(() => chainObj);
  chainObj.run = vi.fn();

  return {
    chain: vi.fn(() => chainObj),
    _chainObj: chainObj,
  };
}

describe("InlineAI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.completionValue = "";
    mocks.isLoadingValue = false;
  });

  it("should render floating icon initially (stage 1)", () => {
    const editor = createMockEditor();
    render(
      <InlineAI
        editor={editor as never}
        documentId="doc-1"
        provider="anthropic"
        model="claude-sonnet-4-5-20250929"
        selectedText="some selected text"
        selectionFrom={10}
        selectionTo={28}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByTestId("inline-ai-icon")).toBeDefined();
  });

  it("should show action menu with 7 presets on icon click (stage 2)", async () => {
    const editor = createMockEditor();
    render(
      <InlineAI
        editor={editor as never}
        documentId="doc-1"
        provider="anthropic"
        model="claude-sonnet-4-5-20250929"
        selectedText="some selected text"
        selectionFrom={10}
        selectionTo={28}
        onDismiss={vi.fn()}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("inline-ai-icon"));
    });

    expect(screen.getByTestId("inline-ai-menu")).toBeDefined();
    expect(screen.getByText("Rephrase")).toBeDefined();
    expect(screen.getByText("Shorten")).toBeDefined();
    expect(screen.getByText("Elaborate")).toBeDefined();
    expect(screen.getByText("More formal")).toBeDefined();
    expect(screen.getByText("More casual")).toBeDefined();
    expect(screen.getByText("Bulletize")).toBeDefined();
    expect(screen.getByText("Summarize")).toBeDefined();
  });

  it("should call complete with preset prompt on click", async () => {
    const editor = createMockEditor();
    render(
      <InlineAI
        editor={editor as never}
        documentId="doc-1"
        provider="anthropic"
        model="claude-sonnet-4-5-20250929"
        selectedText="messy text"
        selectionFrom={0}
        selectionTo={10}
        onDismiss={vi.fn()}
      />
    );

    // Click icon to open menu
    await act(async () => {
      fireEvent.click(screen.getByTestId("inline-ai-icon"));
    });

    // Click preset
    await act(async () => {
      fireEvent.click(screen.getByText("Rephrase"));
    });

    expect(mocks.mockComplete).toHaveBeenCalledWith(
      expect.stringContaining("Rephrase"),
      expect.objectContaining({
        body: expect.objectContaining({
          mode: "inline",
          provider: "anthropic",
          model: "claude-sonnet-4-5-20250929",
          selectedText: "messy text",
        }),
      })
    );
  });

  it("should show suggestion card with diff when completion exists (stage 3)", async () => {
    mocks.completionValue = "improved AI text";
    const editor = createMockEditor();

    const { container } = render(
      <InlineAI
        editor={editor as never}
        documentId="doc-1"
        provider="anthropic"
        model="claude-sonnet-4-5-20250929"
        selectedText="original"
        selectionFrom={5}
        selectionTo={13}
        onDismiss={vi.fn()}
      />
    );

    // Click icon → menu → a preset to reach suggestion stage
    await act(async () => {
      fireEvent.click(screen.getByTestId("inline-ai-icon"));
    });
    await act(async () => {
      fireEvent.click(screen.getByText("Rephrase"));
    });

    // Should show diff with original and suggestion
    expect(container.querySelector(".diff-remove")).toBeTruthy();
    expect(container.querySelector(".diff-add")).toBeTruthy();
    expect(screen.getByRole("button", { name: /insert/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /reject/i })).toBeDefined();
  });

  it("should accept AI text and log interaction", async () => {
    mocks.completionValue = "improved AI text";
    const editor = createMockEditor();

    render(
      <InlineAI
        editor={editor as never}
        documentId="doc-1"
        provider="anthropic"
        model="claude-sonnet-4-5-20250929"
        selectedText="original text"
        selectionFrom={10}
        selectionTo={23}
        onDismiss={vi.fn()}
      />
    );

    // Navigate to suggestion stage
    await act(async () => {
      fireEvent.click(screen.getByTestId("inline-ai-icon"));
    });
    await act(async () => {
      fireEvent.click(screen.getByText("Rephrase"));
    });

    const insertButton = screen.getByRole("button", { name: /insert/i });
    await act(async () => {
      fireEvent.click(insertButton);
    });

    expect(editor.chain).toHaveBeenCalled();
    expect(editor._chainObj.insertContentAt).toHaveBeenCalledWith(
      { from: 10, to: 23 },
      [
        {
          type: "text",
          text: "improved AI text",
          marks: [
            {
              type: "origin",
              attrs: {
                type: "ai",
                sourceId: "mock-nanoid-123",
                originalLength: 16,
                originalText: "improved AI text",
              },
            },
          ],
        },
      ]
    );
    expect(editor._chainObj.run).toHaveBeenCalled();

    expect(mocks.mockLogAIInteraction).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: "doc-1",
        mode: "inline",
        response: "improved AI text",
        action: "accepted",
        provider: "anthropic",
        model: "claude-sonnet-4-5-20250929",
      })
    );
  });

  it("should accept on Tab key when suggestion is shown", async () => {
    mocks.completionValue = "improved text";
    const onDismiss = vi.fn();
    const editor = createMockEditor();

    render(
      <InlineAI
        editor={editor as never}
        documentId="doc-1"
        provider="anthropic"
        model="claude-sonnet-4-5-20250929"
        selectedText="original"
        selectionFrom={0}
        selectionTo={8}
        onDismiss={onDismiss}
      />
    );

    // Navigate to suggestion stage
    await act(async () => {
      fireEvent.click(screen.getByTestId("inline-ai-icon"));
    });
    await act(async () => {
      fireEvent.click(screen.getByText("Rephrase"));
    });

    // Press Tab to accept
    await act(async () => {
      fireEvent.keyDown(window, { key: "Tab" });
    });

    expect(editor.chain).toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalled();
  });

  it("should dismiss on Escape key", async () => {
    const onDismiss = vi.fn();
    const editor = createMockEditor();

    render(
      <InlineAI
        editor={editor as never}
        documentId="doc-1"
        provider="anthropic"
        selectedText="text"
        selectionFrom={0}
        selectionTo={4}
        onDismiss={onDismiss}
      />
    );

    await act(async () => {
      fireEvent.keyDown(window, { key: "Escape" });
    });

    expect(onDismiss).toHaveBeenCalled();
  });

  it("should dismiss on reject", async () => {
    mocks.completionValue = "some suggestion";
    const onDismiss = vi.fn();
    const editor = createMockEditor();

    render(
      <InlineAI
        editor={editor as never}
        documentId="doc-1"
        provider="anthropic"
        model="claude-sonnet-4-5-20250929"
        selectedText="text"
        selectionFrom={0}
        selectionTo={4}
        onDismiss={onDismiss}
      />
    );

    // Navigate to suggestion stage
    await act(async () => {
      fireEvent.click(screen.getByTestId("inline-ai-icon"));
    });
    await act(async () => {
      fireEvent.click(screen.getByText("Rephrase"));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /reject/i }));
    });

    expect(mocks.mockSetCompletion).toHaveBeenCalledWith("");
    expect(onDismiss).toHaveBeenCalled();
  });
});
