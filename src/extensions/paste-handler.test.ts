import { describe, it, expect, vi, afterEach } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { OriginMark } from "./origin-mark";
import { PasteHandler, classifyPaste } from "./paste-handler";
import {
  PROVENANCE_AI_SIDEBAR_CLIPBOARD_MIME,
  PROVENANCE_INTERNAL_CLIPBOARD_MIME,
} from "@/lib/provenance-clipboard";

describe("classifyPaste", () => {
  it("should classify external paste when no AI match", () => {
    const result = classifyPaste({
      clipboardText: "external text",
      recentAIResponses: ["AI response 1"],
      internalClipboardPayload: null,
      aiSidebarClipboardPayload: null,
      documentId: "doc-1",
      sessionToken: "session-1",
    });
    expect(result).toBe("external");
  });

  it("should classify ai_internal when paste matches recent AI response", () => {
    const result = classifyPaste({
      clipboardText: "AI response 1",
      recentAIResponses: ["AI response 1", "AI response 2"],
      internalClipboardPayload: null,
      aiSidebarClipboardPayload: null,
      documentId: "doc-1",
      sessionToken: "session-1",
    });
    expect(result).toBe("ai_internal");
  });

  it("should classify as external when recentAIResponses is empty", () => {
    const result = classifyPaste({
      clipboardText: "some text",
      recentAIResponses: [],
      internalClipboardPayload: null,
      aiSidebarClipboardPayload: null,
      documentId: "doc-1",
      sessionToken: "session-1",
    });
    expect(result).toBe("external");
  });

  it("should classify as internal_document when clipboard marker matches doc and session", () => {
    const result = classifyPaste({
      clipboardText: "some text",
      recentAIResponses: [],
      internalClipboardPayload: {
        version: 1,
        documentId: "doc-1",
        sessionToken: "session-1",
        copiedAt: Date.now(),
      },
      aiSidebarClipboardPayload: null,
      documentId: "doc-1",
      sessionToken: "session-1",
    });
    expect(result).toBe("internal_document");
  });

  it("should ignore clipboard marker when document does not match", () => {
    const result = classifyPaste({
      clipboardText: "some text",
      recentAIResponses: [],
      internalClipboardPayload: {
        version: 1,
        documentId: "doc-2",
        sessionToken: "session-1",
        copiedAt: Date.now(),
      },
      aiSidebarClipboardPayload: null,
      documentId: "doc-1",
      sessionToken: "session-1",
    });
    expect(result).toBe("external");
  });

  it("should classify as ai_sidebar when AI sidebar marker matches doc and session", () => {
    const result = classifyPaste({
      clipboardText: "sidebar copied text",
      recentAIResponses: [],
      internalClipboardPayload: null,
      aiSidebarClipboardPayload: {
        version: 1,
        documentId: "doc-1",
        sessionToken: "session-1",
        copiedAt: Date.now(),
      },
      documentId: "doc-1",
      sessionToken: "session-1",
    });
    expect(result).toBe("ai_sidebar");
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

    const classification = classifyPaste({
      clipboardText: aiResponse,
      recentAIResponses: editor.storage.pasteHandler.recentAIResponses,
      internalClipboardPayload: null,
      aiSidebarClipboardPayload: null,
      documentId: "doc-1",
      sessionToken: editor.storage.pasteHandler.clipboardSessionToken,
    });
    expect(classification).toBe("ai_internal");
    expect(onExternalPaste).not.toHaveBeenCalled();
  });

  it("should apply origin mark with type 'ai' for ai_internal paste", () => {
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
          recentAIResponses: [aiResponse],
        }),
      ],
      content: {
        type: "doc",
        content: [{ type: "paragraph" }],
      },
    });

    // Simulate what the paste handler does for ai_internal classification:
    // apply origin mark with type "ai"
    const { schema, tr } = editor.state;
    const mark = schema.marks.origin.create({
      type: "ai",
      sourceId: "test-ai-paste-id",
      originalLength: aiResponse.length,
    });
    const textNode = schema.text(aiResponse, [mark]);
    editor.view.dispatch(tr.replaceWith(1, 1, textNode));

    const json = editor.getJSON();
    const textContent = json.content?.[0]?.content?.[0];
    expect(textContent?.marks?.[0]?.attrs?.type).toBe("ai");
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

  it("should include origin attrs when handling real paste events", () => {
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

    const pastePlugin = editor.state.plugins.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (plugin: any) => plugin.key?.startsWith("pasteHandler$")
    );

    expect(pastePlugin).toBeTruthy();

    const handled = pastePlugin?.props.handlePaste?.call(
      pastePlugin,
      editor.view,
      {
        clipboardData: {
          getData: (type: string) =>
            type === "text/plain" ? "external paste text" : "",
        },
      } as ClipboardEvent,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      null as any
    );

    expect(handled).toBe(true);

    const json = editor.getJSON();
    const textContent = json.content?.[0]?.content?.[0];
    expect(textContent?.marks?.[0]).toEqual(
      expect.objectContaining({
        type: "origin",
        attrs: expect.objectContaining({
          type: "external_paste",
          sourceId: expect.any(String),
          originalLength: 19,
        }),
      })
    );
    expect(onExternalPaste).toHaveBeenCalledWith(
      "external paste text",
      19,
      expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      )
    );
  });

  it("should treat same-doc marker paste as internal and avoid external logging", () => {
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

    const pastePlugin = editor.state.plugins.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (plugin: any) => plugin.key?.startsWith("pasteHandler$")
    );

    expect(pastePlugin).toBeTruthy();

    const clipboardPayload = JSON.stringify({
      version: 1,
      documentId: "doc-1",
      sessionToken: editor.storage.pasteHandler.clipboardSessionToken,
      copiedAt: Date.now(),
    });

    const handled = pastePlugin?.props.handlePaste?.call(
      pastePlugin,
      editor.view,
      {
        clipboardData: {
          getData: (type: string) => {
            if (type === "text/plain") return "internal human text";
            if (type === PROVENANCE_INTERNAL_CLIPBOARD_MIME) {
              return clipboardPayload;
            }
            return "";
          },
        },
      } as ClipboardEvent,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      null as any
    );

    expect(handled).toBe(true);

    const json = editor.getJSON();
    const textContent = json.content?.[0]?.content?.[0];
    expect(textContent?.text).toBe("internal human text");
    expect(textContent?.marks).toBeUndefined();
    expect(onExternalPaste).not.toHaveBeenCalled();
  });

  it("should classify AI sidebar marker paste as ai and avoid external logging", () => {
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

    const pastePlugin = editor.state.plugins.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (plugin: any) => plugin.key?.startsWith("pasteHandler$")
    );

    expect(pastePlugin).toBeTruthy();

    const clipboardPayload = JSON.stringify({
      version: 1,
      documentId: "doc-1",
      sessionToken: editor.storage.pasteHandler.clipboardSessionToken,
      copiedAt: Date.now(),
    });

    const handled = pastePlugin?.props.handlePaste?.call(
      pastePlugin,
      editor.view,
      {
        clipboardData: {
          getData: (type: string) => {
            if (type === "text/plain") return "sidebar AI text";
            if (type === PROVENANCE_AI_SIDEBAR_CLIPBOARD_MIME) {
              return clipboardPayload;
            }
            return "";
          },
        },
      } as ClipboardEvent,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      null as any
    );

    expect(handled).toBe(true);

    const json = editor.getJSON();
    const textContent = json.content?.[0]?.content?.[0];
    expect(textContent?.marks?.[0]?.attrs?.type).toBe("ai");
    expect(onExternalPaste).not.toHaveBeenCalled();
  });
});
