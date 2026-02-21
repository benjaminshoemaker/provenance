import { Mark, mergeAttributes } from "@tiptap/core";

export const OriginMark = Mark.create({
  name: "origin",

  addAttributes() {
    return {
      type: { default: "human" },
      sourceId: { default: null },
      originalLength: { default: null },
      originalText: { default: null },
    };
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes({ "data-origin": "" }, HTMLAttributes),
      0,
    ];
  },

  parseHTML() {
    return [{ tag: "span[data-origin]" }];
  },
});
