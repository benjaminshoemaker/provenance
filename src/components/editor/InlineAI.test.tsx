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

  it("should render toolbar with presets initially", () => {
    const editor = createMockEditor();
    render(
      <InlineAI
        editor={editor as never}
        documentId="doc-1"
        provider="anthropic"
        selectedText="some selected text"
        selectionFrom={10}
        selectionTo={28}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByTestId("inline-ai-toolbar")).toBeDefined();
    expect(screen.getByText("Improve")).toBeDefined();
    expect(screen.getByText("Simplify")).toBeDefined();
    expect(screen.getByText("Expand")).toBeDefined();
    expect(screen.getByText("Fix")).toBeDefined();
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

    await act(async () => {
      fireEvent.click(screen.getByText("Simplify"));
    });

    expect(mocks.mockComplete).toHaveBeenCalledWith(
      expect.stringContaining("Simplify"),
      expect.objectContaining({
        body: expect.objectContaining({
          mode: "inline",
          provider: "anthropic",
          selectedText: "messy text",
        }),
      })
    );
  });

  it("should show card-based chooser with original as first card", async () => {
    mocks.completionValue = "improved AI text";
    const editor = createMockEditor();

    render(
      <InlineAI
        editor={editor as never}
        documentId="doc-1"
        provider="anthropic"
        selectedText="original text here"
        selectionFrom={5}
        selectionTo={23}
        onDismiss={vi.fn()}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByText("Improve"));
    });

    // Should show the chooser
    expect(screen.getByTestId("inline-ai-chooser")).toBeDefined();

    // Original card should be present and selected
    const originalCard = screen.getByTestId("choice-original");
    expect(originalCard).toBeDefined();
    expect(originalCard.textContent).toContain("YOUR ORIGINAL");
    expect(originalCard.textContent).toContain("original text here");

    // Suggestion card should be present
    const suggestionCard = screen.getByTestId("choice-suggestion-1");
    expect(suggestionCard).toBeDefined();
    expect(suggestionCard.textContent).toContain("SUGGESTION 1");
    expect(suggestionCard.textContent).toContain("improved AI text");

    // Confirm button should be present
    expect(screen.getByText("Confirm Selection")).toBeDefined();
  });

  it("should render two AI suggestion cards when completion includes two suggestions", async () => {
    mocks.completionValue = `SUGGESTION 1:
First rewrite option.
---
SUGGESTION 2:
Second rewrite option.`;
    const editor = createMockEditor();

    render(
      <InlineAI
        editor={editor as never}
        documentId="doc-1"
        provider="anthropic"
        selectedText="original text"
        selectionFrom={0}
        selectionTo={13}
        onDismiss={vi.fn()}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByText("Improve"));
    });

    expect(screen.getByTestId("choice-suggestion-1").textContent).toContain("First rewrite option.");
    expect(screen.getByTestId("choice-suggestion-2").textContent).toContain("Second rewrite option.");
  });

  it("should confirm original text and log as rejected", async () => {
    mocks.completionValue = "improved AI text";
    const onDismiss = vi.fn();
    const editor = createMockEditor();

    render(
      <InlineAI
        editor={editor as never}
        documentId="doc-1"
        provider="anthropic"
        selectedText="original text"
        selectionFrom={0}
        selectionTo={13}
        onDismiss={onDismiss}
      />
    );

    // Open chooser
    await act(async () => {
      fireEvent.click(screen.getByText("Improve"));
    });

    // Original is already selected, click Confirm
    await act(async () => {
      fireEvent.click(screen.getByText("Confirm Selection"));
    });

    // Should NOT insert into editor (kept original)
    expect(editor.chain).not.toHaveBeenCalled();
    // Should log as rejected
    expect(mocks.mockLogAIInteraction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "rejected",
      })
    );
    expect(onDismiss).toHaveBeenCalled();
  });

  it("should confirm AI suggestion and log as accepted", async () => {
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

    // Open chooser
    await act(async () => {
      fireEvent.click(screen.getByText("Improve"));
    });

    // Click suggestion card to select it
    await act(async () => {
      fireEvent.click(screen.getByTestId("choice-suggestion-1"));
    });

    // Confirm
    await act(async () => {
      fireEvent.click(screen.getByText("Confirm Selection"));
    });

    // Should insert into editor
    expect(editor.chain).toHaveBeenCalled();
    expect(editor._chainObj.insertContentAt).toHaveBeenCalledWith(
      { from: 10, to: 23 },
      [
        expect.objectContaining({
          type: "text",
          text: "improved AI text",
          marks: [
            expect.objectContaining({
              type: "origin",
              attrs: expect.objectContaining({
                type: "ai",
                sourceId: expect.stringMatching(
                  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
                ),
                originalLength: 16,
                originalText: "improved AI text",
              }),
            }),
          ],
        }),
      ]
    );
    expect(mocks.mockLogAIInteraction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "accepted",
        response: "improved AI text",
        sourceId: expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        ),
      })
    );
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

  it("should navigate choices with arrow keys and confirm with Enter", async () => {
    mocks.completionValue = "improved text";
    const editor = createMockEditor();

    render(
      <InlineAI
        editor={editor as never}
        documentId="doc-1"
        provider="anthropic"
        selectedText="original"
        selectionFrom={0}
        selectionTo={8}
        onDismiss={vi.fn()}
      />
    );

    // Open chooser
    await act(async () => {
      fireEvent.click(screen.getByText("Improve"));
    });

    // Press ArrowDown to select suggestion
    await act(async () => {
      fireEvent.keyDown(window, { key: "ArrowDown" });
    });

    // Press Enter to confirm
    await act(async () => {
      fireEvent.keyDown(window, { key: "Enter" });
    });

    // Should accept the suggestion (not original)
    expect(editor.chain).toHaveBeenCalled();
    expect(mocks.mockLogAIInteraction).toHaveBeenCalledWith(
      expect.objectContaining({ action: "accepted" })
    );
  });

  it("should show keyboard shortcuts in footer", async () => {
    mocks.completionValue = "suggestion";
    const editor = createMockEditor();

    render(
      <InlineAI
        editor={editor as never}
        documentId="doc-1"
        provider="anthropic"
        selectedText="text"
        selectionFrom={0}
        selectionTo={4}
        onDismiss={vi.fn()}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByText("Improve"));
    });

    expect(screen.getByText(/navigate/)).toBeDefined();
    expect(screen.getByText(/confirm/)).toBeDefined();
    expect(screen.getByText(/dismiss/)).toBeDefined();
  });
});
