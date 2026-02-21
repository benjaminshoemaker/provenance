import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { nanoid } from "nanoid";

export interface PasteHandlerOptions {
  documentId: string;
  onExternalPaste?: (content: string, characterCount: number) => void;
  recentAIResponses: string[];
}

export function classifyPaste(
  clipboardText: string,
  recentAIResponses: string[]
): "external" | "ai_internal" {
  return recentAIResponses.some((r) => r === clipboardText)
    ? "ai_internal"
    : "external";
}

export const PasteHandler = Extension.create<PasteHandlerOptions>({
  name: "pasteHandler",

  addOptions() {
    return {
      documentId: "",
      onExternalPaste: undefined,
      recentAIResponses: [],
    };
  },

  addProseMirrorPlugins() {
    const { onExternalPaste, recentAIResponses } = this.options;

    return [
      new Plugin({
        key: new PluginKey("pasteHandler"),
        props: {
          handlePaste(view, event) {
            const clipboardText =
              event.clipboardData?.getData("text/plain");
            if (!clipboardText) return false;

            const classification = classifyPaste(
              clipboardText,
              recentAIResponses
            );

            if (classification === "ai_internal") {
              // Let default paste handling proceed — AI origin is
              // tracked separately through the AI interaction flow.
              return false;
            }

            // External paste — apply origin mark and log
            const { schema } = view.state;
            const originMarkType = schema.marks.origin;
            if (!originMarkType) return false;

            const sourceId = nanoid();
            const mark = originMarkType.create({
              type: "external_paste",
              sourceId,
              originalLength: clipboardText.length,
            });

            const textNode = schema.text(clipboardText, [mark]);
            const { from, to } = view.state.selection;
            const tr = view.state.tr.replaceWith(from, to, textNode);
            view.dispatch(tr);

            onExternalPaste?.(clipboardText, clipboardText.length);

            return true;
          },
        },
      }),
    ];
  },
});
