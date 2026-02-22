import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export const selectionHighlightKey = new PluginKey("selectionHighlight");

interface HighlightState {
  from: number;
  to: number;
  active: boolean;
}

export const SelectionHighlight = Extension.create({
  name: "selectionHighlight",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: selectionHighlightKey,
        state: {
          init: (): HighlightState => ({ from: 0, to: 0, active: false }),
          apply: (tr, value: HighlightState): HighlightState => {
            const meta = tr.getMeta(selectionHighlightKey) as
              | HighlightState
              | undefined;
            if (meta) return meta;
            // Map positions through document changes
            if (value.active && tr.docChanged) {
              return {
                from: tr.mapping.map(value.from),
                to: tr.mapping.map(value.to),
                active: true,
              };
            }
            return value;
          },
        },
        props: {
          decorations(state) {
            const pluginState = selectionHighlightKey.getState(
              state
            ) as HighlightState;
            if (
              !pluginState?.active ||
              pluginState.from >= pluginState.to ||
              pluginState.to > state.doc.content.size
            ) {
              return DecorationSet.empty;
            }
            return DecorationSet.create(state.doc, [
              Decoration.inline(pluginState.from, pluginState.to, {
                class: "inline-ai-highlight",
              }),
            ]);
          },
        },
      }),
    ];
  },
});
