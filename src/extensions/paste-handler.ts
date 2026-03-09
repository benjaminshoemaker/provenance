import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { DOMParser as ProseMirrorDOMParser } from "@tiptap/pm/model";
import type { Slice, MarkType, Schema } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";
import {
  PROVENANCE_AI_SIDEBAR_CLIPBOARD_MIME,
  PROVENANCE_INTERNAL_CLIPBOARD_MIME,
  createProvenanceClipboardPayload,
  isValidProvenanceClipboardPayload,
  parseProvenanceClipboardPayload,
  type ProvenanceClipboardPayload,
} from "@/lib/provenance-clipboard";

type PasteClassification =
  | "external"
  | "ai_internal"
  | "ai_sidebar"
  | "internal_document";

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
  params: {
    clipboardText: string;
    recentAIResponses: string[];
    internalClipboardPayload: ProvenanceClipboardPayload | null;
    aiSidebarClipboardPayload: ProvenanceClipboardPayload | null;
    documentId: string;
    sessionToken: string;
  }
): PasteClassification {
  const {
    clipboardText,
    recentAIResponses,
    internalClipboardPayload,
    aiSidebarClipboardPayload,
    documentId,
    sessionToken,
  } = params;

  if (
    isValidProvenanceClipboardPayload({
      payload: internalClipboardPayload,
      documentId,
      sessionToken,
    })
  ) {
    return "internal_document";
  }

  if (
    isValidProvenanceClipboardPayload({
      payload: aiSidebarClipboardPayload,
      documentId,
      sessionToken,
    })
  ) {
    return "ai_sidebar";
  }

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

function getClipboardText(event: ClipboardEvent, fallbackSlice: Slice) {
  return (
    event.clipboardData?.getData("text/plain") ??
    fallbackSlice.content.textBetween(0, fallbackSlice.content.size, "\n\n")
  );
}

function writeInternalClipboardPayload(params: {
  event: ClipboardEvent;
  documentId: string;
  sessionToken: string;
}) {
  const { event, documentId, sessionToken } = params;
  const clipboardData = event.clipboardData;
  if (!clipboardData) return;

  try {
    clipboardData.setData(
      PROVENANCE_INTERNAL_CLIPBOARD_MIME,
      JSON.stringify(
        createProvenanceClipboardPayload({
          documentId,
          sessionToken,
        })
      )
    );
  } catch {
    // Ignore browsers that block custom clipboard mime writes.
  }
}

function readProvenanceClipboardPayload(
  event: ClipboardEvent,
  mimeType: string
): ProvenanceClipboardPayload | null {
  return parseProvenanceClipboardPayload(event.clipboardData?.getData(mimeType));
}

function buildOriginMark(
  originMarkType: MarkType,
  classification: "external" | "ai_internal" | "ai_sidebar",
  clipboardText: string,
  sourceId: string
) {
  const isAIOrigin =
    classification === "ai_internal" || classification === "ai_sidebar";
  return originMarkType.create({
    type: isAIOrigin ? "ai" : "external_paste",
    touchedByAI: isAIOrigin,
    sourceId,
    originalLength: clipboardText.length,
  });
}

function parseClipboardSlice(
  event: ClipboardEvent,
  schema: Schema,
  fallbackSlice: Slice
) {
  const clipboardHtml = event.clipboardData?.getData("text/html");
  if (!clipboardHtml) {
    return fallbackSlice;
  }

  const wrapper = document.createElement("div");
  wrapper.innerHTML = clipboardHtml;
  return ProseMirrorDOMParser.fromSchema(schema).parseSlice(wrapper) ?? fallbackSlice;
}

function applyMarkedPaste(params: {
  view: EditorView;
  from: number;
  to: number;
  parsedSlice: Slice | null;
  clipboardText: string;
  originMark: ReturnType<MarkType["create"]>;
}) {
  const { view, from, to, parsedSlice, clipboardText, originMark } = params;
  const { schema } = view.state;

  if (parsedSlice && parsedSlice.content.childCount > 0) {
    const tr = view.state.tr.replaceRange(from, to, parsedSlice);
    const insertEnd = tr.mapping.map(to);
    tr.addMark(from, insertEnd, originMark);
    view.dispatch(tr);
    return;
  }

  const textNode = schema.text(clipboardText, [originMark]);
  const tr = view.state.tr.replaceWith(from, to, textNode);
  view.dispatch(tr);
}

function applyUnmarkedPaste(params: {
  view: EditorView;
  from: number;
  to: number;
  parsedSlice: Slice | null;
  clipboardText: string;
}) {
  const { view, from, to, parsedSlice, clipboardText } = params;
  const { schema } = view.state;

  if (parsedSlice && parsedSlice.content.childCount > 0) {
    const tr = view.state.tr.replaceRange(from, to, parsedSlice);
    view.dispatch(tr);
    return;
  }

  const textNode = schema.text(clipboardText);
  const tr = view.state.tr.replaceWith(from, to, textNode);
  view.dispatch(tr);
}

declare module "@tiptap/core" {
  interface Storage {
    pasteHandler: {
      recentAIResponses: string[];
      clipboardSessionToken: string;
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
      clipboardSessionToken: createSourceId(),
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
    const { onExternalPaste, documentId } = this.options;
    const storage = this.storage;

    return [
      new Plugin({
        key: new PluginKey("pasteHandler"),
        props: {
          handleDOMEvents: {
            copy(view, event) {
              const clipboardEvent = event as ClipboardEvent;
              if (view.state.selection.empty) return false;
              writeInternalClipboardPayload({
                event: clipboardEvent,
                documentId,
                sessionToken: storage.clipboardSessionToken,
              });
              return false;
            },
            cut(view, event) {
              const clipboardEvent = event as ClipboardEvent;
              if (view.state.selection.empty) return false;
              writeInternalClipboardPayload({
                event: clipboardEvent,
                documentId,
                sessionToken: storage.clipboardSessionToken,
              });
              return false;
            },
          },
          handlePaste(view, event, slice) {
            const clipboardText = getClipboardText(event, slice);
            if (!clipboardText) return false;

            const { schema } = view.state;
            const originMarkType = schema.marks.origin;
            if (!originMarkType) return false;

            const internalClipboardPayload = readProvenanceClipboardPayload(
              event,
              PROVENANCE_INTERNAL_CLIPBOARD_MIME
            );
            const aiSidebarClipboardPayload = readProvenanceClipboardPayload(
              event,
              PROVENANCE_AI_SIDEBAR_CLIPBOARD_MIME
            );
            const classification = classifyPaste(
              {
                clipboardText,
                recentAIResponses: storage.recentAIResponses,
                internalClipboardPayload,
                aiSidebarClipboardPayload,
                documentId,
                sessionToken: storage.clipboardSessionToken,
              }
            );

            const { from, to } = view.state.selection;
            const parsedSlice = parseClipboardSlice(event, schema, slice);
            if (classification === "internal_document") {
              applyUnmarkedPaste({
                view,
                from,
                to,
                parsedSlice,
                clipboardText,
              });
              return true;
            }

            const sourceId = createSourceId();
            const originMark = buildOriginMark(
              originMarkType,
              classification,
              clipboardText,
              sourceId
            );

            applyMarkedPaste({
              view,
              from,
              to,
              parsedSlice,
              clipboardText,
              originMark,
            });

            if (classification === "external") {
              onExternalPaste?.(clipboardText, clipboardText.length, sourceId);
            }

            return true;
          },
        },
      }),
    ];
  },
});
