import { describe, it, expect } from "vitest";
import { extractPlainText } from "./tiptap-utils";

describe("extractPlainText", () => {
  it("should extract text from a simple paragraph", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Hello world" }],
        },
      ],
    };

    expect(extractPlainText(doc)).toBe("Hello world");
  });

  it("should extract text from multiple paragraphs with newlines", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "First paragraph" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Second paragraph" }],
        },
      ],
    };

    expect(extractPlainText(doc)).toBe("First paragraph\nSecond paragraph");
  });

  it("should handle nested content with marks", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Normal " },
            {
              type: "text",
              text: "bold",
              marks: [{ type: "bold" }],
            },
            { type: "text", text: " text" },
          ],
        },
      ],
    };

    expect(extractPlainText(doc)).toBe("Normal bold text");
  });

  it("should handle headings", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "Title" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Content" }],
        },
      ],
    };

    expect(extractPlainText(doc)).toBe("Title\nContent");
  });

  it("should handle empty document", () => {
    const doc = {
      type: "doc",
      content: [{ type: "paragraph" }],
    };

    expect(extractPlainText(doc)).toBe("");
  });

  it("should handle document with no content", () => {
    const doc = { type: "doc" };
    expect(extractPlainText(doc)).toBe("");
  });
});
