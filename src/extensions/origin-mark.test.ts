import { describe, it, expect, afterEach } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { OriginMark } from "./origin-mark";

function createEditor(content?: Record<string, unknown>) {
  return new Editor({
    element: document.createElement("div"),
    extensions: [StarterKit, OriginMark],
    content: content ?? { type: "doc", content: [{ type: "paragraph" }] },
  });
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
    const textNode = json.content?.[0]?.content?.[0];
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
    const textNode = json.content?.[0]?.content?.[0];
    expect(textNode?.text).toBe("Human typed text");
    expect(textNode?.marks).toBeUndefined();
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
