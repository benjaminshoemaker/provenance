import { describe, it, expect, afterEach } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { OriginMark, originTypingPolicyPluginKey } from "./origin-mark";

function createEditor(content?: Record<string, unknown> | string) {
  return new Editor({
    element: document.createElement("div"),
    extensions: [StarterKit, OriginMark],
    content: content ?? { type: "doc", content: [{ type: "paragraph" }] },
  });
}

function typeTextViaInputPolicy(editor: Editor, text: string) {
  const typingPolicyPlugin = editor.state.plugins.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (plugin: any) =>
      typeof plugin.props.handleTextInput === "function" &&
      plugin.key?.startsWith(originTypingPolicyPluginKey.key)
  );

  expect(typingPolicyPlugin).toBeTruthy();

  const { from, to } = editor.state.selection;
  const handled = typingPolicyPlugin?.props.handleTextInput?.call(
    typingPolicyPlugin,
    editor.view,
    from,
    to,
    text
  );
  expect(handled).toBe(true);
}

describe("OriginMark", () => {
  let editor: Editor;

  afterEach(() => {
    editor?.destroy();
  });

  it("should persist through editor JSON serialization/deserialization", () => {
    const docWithMark = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "AI generated text",
              marks: [
                {
                  type: "origin",
                  attrs: {
                    type: "ai",
                    sourceId: "interaction-123",
                    originalLength: 17,
                  },
                },
              ],
            },
          ],
        },
      ],
    };

    editor = createEditor(docWithMark);
    const json = editor.getJSON();

    const textNode = json.content?.[0]?.content?.[0];
    expect(textNode?.marks).toEqual([
      {
        type: "origin",
        attrs: {
          type: "ai",
          sourceId: "interaction-123",
          originalLength: 17,
          originalText: null,
        },
      },
    ]);

    // Re-create editor from serialized JSON to verify round-trip
    const editor2 = createEditor(json);
    const json2 = editor2.getJSON();
    const textNode2 = json2.content?.[0]?.content?.[0];
    expect(textNode2?.marks).toEqual(textNode?.marks);
    editor2.destroy();
  });

  it("should preserve attrs through HTML round-trip parsing", () => {
    editor = createEditor({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "pasted text",
              marks: [
                {
                  type: "origin",
                  attrs: {
                    type: "external_paste",
                    sourceId: "paste-123",
                    originalLength: 11,
                    originalText: "pasted text",
                  },
                },
              ],
            },
          ],
        },
      ],
    });

    const html = editor.getHTML();

    const editor2 = createEditor(html);
    const json2 = editor2.getJSON();
    const textNode2 = json2.content?.[0]?.content?.[0];

    expect(textNode2?.marks).toEqual([
      {
        type: "origin",
        attrs: {
          type: "external_paste",
          sourceId: "paste-123",
          originalLength: 11,
          originalText: "pasted text",
        },
      },
    ]);

    editor2.destroy();
  });

  it("should preserve attrs when editor root class is mutated", () => {
    editor = createEditor({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "AI generated text",
              marks: [
                {
                  type: "origin",
                  attrs: {
                    type: "ai",
                    sourceId: "interaction-123",
                    originalLength: 17,
                    originalText: "AI generated text",
                  },
                },
              ],
            },
          ],
        },
      ],
    });

    editor.view.dom.classList.add("lens-off");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (editor.view as any).domObserver?.flush?.();

    const json = editor.getJSON();
    const textNode = json.content?.[0]?.content?.[0];
    expect(textNode?.marks).toEqual([
      {
        type: "origin",
        attrs: {
          type: "ai",
          sourceId: "interaction-123",
          originalLength: 17,
          originalText: "AI generated text",
        },
      },
    ]);
  });

  it("should apply origin mark with type='ai' and sourceId for AI text insertion", () => {
    editor = createEditor();

    editor
      .chain()
      .focus()
      .insertContent({
        type: "text",
        text: "AI suggestion",
        marks: [
          {
            type: "origin",
            attrs: {
              type: "ai",
              sourceId: "src-abc",
              originalLength: 13,
            },
          },
        ],
      })
      .run();

    const json = editor.getJSON();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const textNode = json.content?.[0]?.content?.[0] as any;
    expect(textNode?.text).toBe("AI suggestion");
    expect(textNode?.marks?.[0]?.attrs?.type).toBe("ai");
    expect(textNode?.marks?.[0]?.attrs?.sourceId).toBe("src-abc");
    expect(textNode?.marks?.[0]?.attrs?.originalLength).toBe(13);
  });

  it("should treat unmarked text as human (no origin mark present)", () => {
    editor = createEditor({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Human typed text" }],
        },
      ],
    });

    const json = editor.getJSON();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const textNode = json.content?.[0]?.content?.[0] as any;
    expect(textNode?.text).toBe("Human typed text");
    expect(textNode?.marks).toBeUndefined();
  });

  it("should insert unmarked text when typing inside AI-origin text", () => {
    editor = createEditor({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "alpha",
              marks: [
                {
                  type: "origin",
                  attrs: {
                    type: "ai",
                    sourceId: "ai-1",
                    originalLength: 5,
                  },
                },
              ],
            },
          ],
        },
      ],
    });

    editor.commands.setTextSelection(4);
    typeTextViaInputPolicy(editor, "X");

    const paragraphContent = editor.getJSON().content?.[0]?.content;
    expect(paragraphContent?.[1]?.text).toBe("X");
    expect(paragraphContent?.[1]?.marks).toBeUndefined();
  });

  it("should insert unmarked text when typing inside external_paste-origin text", () => {
    editor = createEditor({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "paste",
              marks: [
                {
                  type: "origin",
                  attrs: {
                    type: "external_paste",
                    sourceId: "paste-1",
                    originalLength: 5,
                  },
                },
              ],
            },
          ],
        },
      ],
    });

    editor.commands.setTextSelection(3);
    typeTextViaInputPolicy(editor, "Y");

    const paragraphContent = editor.getJSON().content?.[0]?.content;
    expect(paragraphContent?.[1]?.text).toBe("Y");
    expect(paragraphContent?.[1]?.marks).toBeUndefined();
  });

  it("should keep surrounding origin marks unchanged when typing inside marked text", () => {
    editor = createEditor({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "model",
              marks: [
                {
                  type: "origin",
                  attrs: {
                    type: "ai",
                    sourceId: "ai-2",
                    originalLength: 5,
                  },
                },
              ],
            },
          ],
        },
      ],
    });

    editor.commands.setTextSelection(4);
    typeTextViaInputPolicy(editor, "Z");

    const paragraphContent = editor.getJSON().content?.[0]?.content;
    expect(paragraphContent).toHaveLength(3);
    expect(paragraphContent?.[0]?.marks?.[0]?.attrs?.type).toBe("ai");
    expect(paragraphContent?.[2]?.marks?.[0]?.attrs?.type).toBe("ai");
  });

  it("should preserve non-origin marks and clear origin from stored marks after typing", () => {
    editor = createEditor({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "bolded",
              marks: [
                {
                  type: "origin",
                  attrs: {
                    type: "ai",
                    sourceId: "ai-3",
                    originalLength: 6,
                  },
                },
                {
                  type: "bold",
                },
              ],
            },
          ],
        },
      ],
    });

    editor.commands.setTextSelection(4);
    typeTextViaInputPolicy(editor, "Q");

    const paragraphContent = editor.getJSON().content?.[0]?.content;
    const insertedMarks = paragraphContent?.[1]?.marks?.map((mark) => mark.type) ?? [];
    expect(insertedMarks).toContain("bold");
    expect(insertedMarks).not.toContain("origin");

    const storedMarkNames = (editor.state.storedMarks ?? []).map(
      (mark) => mark.type.name
    );
    expect(storedMarkNames).toContain("bold");
    expect(storedMarkNames).not.toContain("origin");
  });

  it("should render AI text with origin-ai CSS class", () => {
    editor = createEditor({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "ai text",
              marks: [
                {
                  type: "origin",
                  attrs: {
                    type: "ai",
                    sourceId: "s1",
                    originalLength: 7,
                  },
                },
              ],
            },
          ],
        },
      ],
    });

    const html = editor.getHTML();
    expect(html).toContain('class="origin-ai"');
  });

  it("should render pasted text with origin-paste CSS class", () => {
    editor = createEditor({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "pasted text",
              marks: [
                {
                  type: "origin",
                  attrs: {
                    type: "external_paste",
                    sourceId: "p1",
                    originalLength: 11,
                  },
                },
              ],
            },
          ],
        },
      ],
    });

    const html = editor.getHTML();
    expect(html).toContain('class="origin-paste"');
  });

  it("should render human text without origin CSS class", () => {
    editor = createEditor({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "human text",
              marks: [
                {
                  type: "origin",
                  attrs: {
                    type: "human",
                    sourceId: null,
                    originalLength: null,
                  },
                },
              ],
            },
          ],
        },
      ],
    });

    const html = editor.getHTML();
    expect(html).not.toContain("origin-ai");
    expect(html).not.toContain("origin-paste");
  });

  it("should render with data-origin attribute (invisible mark)", () => {
    editor = createEditor({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "marked text",
              marks: [
                {
                  type: "origin",
                  attrs: {
                    type: "ai",
                    sourceId: "s1",
                    originalLength: 11,
                  },
                },
              ],
            },
          ],
        },
      ],
    });

    const html = editor.getHTML();
    expect(html).toContain("data-origin");
  });
});
