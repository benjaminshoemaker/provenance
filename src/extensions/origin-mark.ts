import { Mark, mergeAttributes } from "@tiptap/core";
import type { Mark as ProseMirrorMark } from "@tiptap/pm/model";
import { Plugin, PluginKey, type EditorState } from "@tiptap/pm/state";

export const originTypingPolicyPluginKey = new PluginKey("originTypingPolicy");

function getTypingMarks(
  state: EditorState,
  from: number,
  to: number
): readonly ProseMirrorMark[] {
  if (state.storedMarks) {
    return state.storedMarks;
  }

  const $from = state.doc.resolve(from);
  if (from === to) {
    return $from.marks();
  }

  return $from.marksAcross(state.doc.resolve(to)) ?? [];
}

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

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: originTypingPolicyPluginKey,
        props: {
          handleTextInput(view, from, to, text) {
            const { state } = view;
            const originMarkType = state.schema.marks.origin;
            if (!originMarkType) return false;

            const activeMarks = getTypingMarks(state, from, to);
            const hasOriginMark = activeMarks.some(
              (mark) => mark.type === originMarkType
            );
            if (!hasOriginMark) return false;

            const nextMarks = activeMarks.filter(
              (mark) => mark.type !== originMarkType
            );
            const tr = state.tr;

            tr.setStoredMarks(nextMarks);
            tr.insertText(text, from, to);
            tr.setStoredMarks(nextMarks);
            view.dispatch(tr);
            return true;
          },
        },
      }),
    ];
  },
});
