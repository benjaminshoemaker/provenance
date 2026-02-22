import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { nanoid } from "nanoid";

export interface PasteHandlerOptions {
  documentId: string;
  onExternalPaste?: (content: string, characterCount: number) => void;
  recentAIResponses?: string[];
  maxRecentAIResponses?: number;
}

export function classifyPaste(
  clipboardText: string,
  recentAIResponses: string[]
): "external" | "ai_internal" {
  return recentAIResponses.some((r) => r === clipboardText)
    ? "ai_internal"
    : "external";
}

declare module "@tiptap/core" {
  interface Storage {
    pasteHandler: {
      recentAIResponses: string[];
    };
  }

  interface Commands<ReturnType> {
    pasteHandler: {
      addRecentAIResponse: (text: string) => ReturnType;
      clearRecentAIResponses: () => ReturnType;
    };
  }
}

export const PasteHandler = Extension.create<PasteHandlerOptions>({
  name: "pasteHandler",

  addOptions() {
    return {
      documentId: "",
      onExternalPaste: undefined,
      recentAIResponses: [],
      maxRecentAIResponses: 10,
    };
  },

  addStorage() {
    return {
      recentAIResponses: [] as string[],
    };
  },

  onCreate() {
    const initial = this.options.recentAIResponses ?? [];
    const max = this.options.maxRecentAIResponses ?? 10;

    if (initial.length > 0) {
      this.storage.recentAIResponses = [...initial].slice(0, max);
    }
  },

  addCommands() {
    return {
      addRecentAIResponse:
        (text: string) =>
        () => {
          const trimmed = text.trim();
          if (!trimmed) return false;

          const max = this.options.maxRecentAIResponses ?? 10;
          const next = [
            trimmed,
            ...this.storage.recentAIResponses.filter((r: string) => r !== trimmed),
          ];
          this.storage.recentAIResponses = next.slice(0, max);
          return true;
        },

      clearRecentAIResponses:
        () =>
        () => {
          this.storage.recentAIResponses = [];
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const { onExternalPaste } = this.options;
    const storage = this.storage;

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
              storage.recentAIResponses
            );

            if (classification === "ai_internal") {
              // Apply origin mark with type "ai" so metrics count this correctly
              const { schema: aiSchema } = view.state;
              const aiOriginMarkType = aiSchema.marks.origin;
              if (!aiOriginMarkType) return false;

              const aiSourceId = nanoid();
              const aiMark = aiOriginMarkType.create({
                type: "ai",
                sourceId: aiSourceId,
                originalLength: clipboardText.length,
              });

              const aiTextNode = aiSchema.text(clipboardText, [aiMark]);
              const { from: aiFrom, to: aiTo } = view.state.selection;
              const aiTr = view.state.tr.replaceWith(aiFrom, aiTo, aiTextNode);
              view.dispatch(aiTr);

              return true;
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
