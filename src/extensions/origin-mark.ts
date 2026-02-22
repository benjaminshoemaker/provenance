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
    const originType = HTMLAttributes.type as string;
    const cssClass =
      originType === "ai"
        ? "origin-ai"
        : originType === "external_paste"
          ? "origin-paste"
          : undefined;

    return [
      "span",
      mergeAttributes(
        { "data-origin": "" },
        HTMLAttributes,
        cssClass ? { class: cssClass } : {}
      ),
      0,
    ];
  },

  parseHTML() {
    return [{ tag: "span[data-origin]" }];
  },
});
