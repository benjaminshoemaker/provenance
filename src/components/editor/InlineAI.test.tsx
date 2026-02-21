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

  it("should render floating toolbar with selection and preset options", () => {
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

    expect(screen.getByText(/Improve/)).toBeDefined();
    expect(screen.getByText(/Simplify/)).toBeDefined();
    expect(screen.getByText(/Fix Grammar/)).toBeDefined();
  });

  it("should call complete with preset prompt on click", async () => {
    const editor = createMockEditor();
    render(
      <InlineAI
        editor={editor as never}
        documentId="doc-1"
        provider="anthropic"
        selectedText="messy text"
        selectionFrom={0}
        selectionTo={10}
        onDismiss={vi.fn()}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByText(/Improve/));
    });

    expect(mocks.mockComplete).toHaveBeenCalledWith(
      expect.stringContaining("Improve"),
      expect.objectContaining({
        body: expect.objectContaining({
          mode: "inline",
          provider: "anthropic",
          selectedText: "messy text",
        }),
      })
    );
  });

  it("should show accept and reject buttons when completion exists", () => {
    mocks.completionValue = "improved AI text";
    const editor = createMockEditor();

    render(
      <InlineAI
        editor={editor as never}
        documentId="doc-1"
        provider="anthropic"
        selectedText="original"
        selectionFrom={5}
        selectionTo={13}
        onDismiss={vi.fn()}
      />
    );

    expect(
      screen.getByRole("button", { name: /accept/i })
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: /reject/i })
    ).toBeDefined();
  });

  it("should accept AI text and log interaction", async () => {
    mocks.completionValue = "improved AI text";
    const editor = createMockEditor();

    render(
      <InlineAI
        editor={editor as never}
        documentId="doc-1"
        provider="anthropic"
        selectedText="original text"
        selectionFrom={10}
        selectionTo={23}
        onDismiss={vi.fn()}
      />
    );

    const acceptButton = screen.getByRole("button", { name: /accept/i });
    await act(async () => {
      fireEvent.click(acceptButton);
    });

    // Verify text was inserted via editor chain
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
              },
            },
          ],
        },
      ]
    );
    expect(editor._chainObj.run).toHaveBeenCalled();

    // Verify interaction was logged
    expect(mocks.mockLogAIInteraction).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: "doc-1",
        mode: "inline",
        response: "improved AI text",
        action: "accepted",
        provider: "anthropic",
      })
    );
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
        selectedText="text"
        selectionFrom={0}
        selectionTo={4}
        onDismiss={onDismiss}
      />
    );

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /reject/i })
      );
    });

    expect(mocks.mockSetCompletion).toHaveBeenCalledWith("");
    expect(onDismiss).toHaveBeenCalled();
  });
});
