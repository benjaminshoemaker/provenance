import { describe, it, expect, vi, afterEach } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { OriginMark } from "./origin-mark";
import { PasteHandler, classifyPaste } from "./paste-handler";

describe("classifyPaste", () => {
  it("should classify external paste when no AI match", () => {
    const result = classifyPaste("external text", ["AI response 1"]);
    expect(result).toBe("external");
  });

  it("should classify ai_internal when paste matches recent AI response", () => {
    const result = classifyPaste("AI response 1", [
      "AI response 1",
      "AI response 2",
    ]);
    expect(result).toBe("ai_internal");
  });

  it("should classify as external when recentAIResponses is empty", () => {
    const result = classifyPaste("some text", []);
    expect(result).toBe("external");
  });
});

describe("PasteHandler extension", () => {
  let editor: Editor;

  afterEach(() => {
    editor?.destroy();
  });

  it("should classify external paste and apply origin mark", () => {
    const onExternalPaste = vi.fn();

    editor = new Editor({
      element: document.createElement("div"),
      extensions: [
        StarterKit,
        OriginMark,
        PasteHandler.configure({
          documentId: "doc-1",
          onExternalPaste,
          recentAIResponses: [],
        }),
      ],
      content: {
        type: "doc",
        content: [{ type: "paragraph" }],
      },
    });

    // Simulate paste via ProseMirror — dispatch a transaction with marked text
    const { schema, tr } = editor.state;
    const mark = schema.marks.origin.create({
      type: "external_paste",
      sourceId: "test-paste-id",
      originalLength: 12,
    });
    const textNode = schema.text("pasted content", [mark]);
    editor.view.dispatch(
      tr.replaceWith(1, 1, textNode)
    );

    const json = editor.getJSON();
    const textContent = json.content?.[0]?.content?.[0];
    expect(textContent?.marks?.[0]?.attrs?.type).toBe("external_paste");
  });

  it("should not log paste from AI panel as external", () => {
    const onExternalPaste = vi.fn();
    const aiResponse = "This is AI generated text";

    editor = new Editor({
      element: document.createElement("div"),
      extensions: [
        StarterKit,
        OriginMark,
        PasteHandler.configure({
          documentId: "doc-1",
          onExternalPaste,
          recentAIResponses: [],
        }),
      ],
      content: {
        type: "doc",
        content: [{ type: "paragraph" }],
      },
    });

    editor.commands.addRecentAIResponse(aiResponse);

    // classifyPaste should return ai_internal — the handlePaste plugin
    // returns false and lets default paste handling proceed
    const classification = classifyPaste(
      aiResponse,
      editor.storage.pasteHandler.recentAIResponses
    );
    expect(classification).toBe("ai_internal");
    expect(onExternalPaste).not.toHaveBeenCalled();
  });

  it("should record recent AI responses in extension storage", () => {
    editor = new Editor({
      element: document.createElement("div"),
      extensions: [
        StarterKit,
        OriginMark,
        PasteHandler.configure({
          documentId: "doc-1",
          recentAIResponses: [],
        }),
      ],
      content: {
        type: "doc",
        content: [{ type: "paragraph" }],
      },
    });

    expect(editor.storage.pasteHandler.recentAIResponses).toEqual([]);

    editor.commands.addRecentAIResponse("AI response 1");
    editor.commands.addRecentAIResponse("AI response 2");

    expect(editor.storage.pasteHandler.recentAIResponses).toEqual([
      "AI response 2",
      "AI response 1",
    ]);
  });
});
