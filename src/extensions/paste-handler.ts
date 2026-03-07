import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { DOMParser as ProseMirrorDOMParser } from "@tiptap/pm/model";

export interface PasteHandlerOptions {
  documentId: string;
  onExternalPaste?: (
    content: string,
    characterCount: number,
    sourceId: string
  ) => void;
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

function createSourceId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  // RFC4122-ish fallback for older runtimes.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const rand = Math.floor(Math.random() * 16);
    const value = char === "x" ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
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
          handlePaste(view, event, slice) {
            const clipboardText =
              event.clipboardData?.getData("text/plain") ??
              slice.content.textBetween(0, slice.content.size, "\n\n");
            if (!clipboardText) return false;

            const { schema } = view.state;
            const originMarkType = schema.marks.origin;
            if (!originMarkType) return false;

            const classification = classifyPaste(
              clipboardText,
              storage.recentAIResponses
            );

            const originType =
              classification === "ai_internal" ? "ai" : "external_paste";
            const sourceId = createSourceId();
            const originMark = originMarkType.create({
              type: originType,
              sourceId,
              originalLength: clipboardText.length,
            });

            const { from, to } = view.state.selection;

            // Try to parse HTML to preserve formatting (headings, bold, etc.)
            const clipboardHtml =
              event.clipboardData?.getData("text/html");
            let parsedSlice = slice;
            if (clipboardHtml) {
              const wrapper = document.createElement("div");
              wrapper.innerHTML = clipboardHtml;
              parsedSlice = ProseMirrorDOMParser.fromSchema(schema).parseSlice(
                wrapper
              );
            }

            if (parsedSlice && parsedSlice.content.childCount > 0) {
              // Insert the parsed rich content, then apply origin mark to the range
              const tr = view.state.tr.replaceRange(from, to, parsedSlice);
              const insertEnd = tr.mapping.map(to);
              tr.addMark(from, insertEnd, originMark);
              view.dispatch(tr);
            } else {
              // Fallback: insert plain text with origin mark
              const textNode = schema.text(clipboardText, [originMark]);
              const tr = view.state.tr.replaceWith(from, to, textNode);
              view.dispatch(tr);
            }

            if (classification !== "ai_internal") {
              onExternalPaste?.(clipboardText, clipboardText.length, sourceId);
            }

            return true;
          },
        },
      }),
    ];
  },
});
