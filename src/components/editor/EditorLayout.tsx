"use client";

import type { RefObject } from "react";
import { EditorContent, type Editor as TiptapEditor } from "@tiptap/react";
import { Sparkle } from "lucide-react";
import { Toolbar } from "./Toolbar";
import { InlineAI } from "./InlineAI";
import type { TextSelection } from "./editor-utils";

interface TriggerPosition {
  top: number;
  left: number;
  right: number;
}

interface EditorLayoutProps {
  editor: TiptapEditor | null;
  documentId: string;
  provider: string;
  model?: string;
  mainRef: RefObject<HTMLElement | null>;
  scrollAreaRef: RefObject<HTMLDivElement | null>;
  proseAreaRef: RefObject<HTMLDivElement | null>;
  hasContent: boolean;
  showLens: boolean;
  chatOpen: boolean;
  editorOpen: boolean;
  showInlineAI: boolean;
  selection: TextSelection | null;
  triggerPosition: TriggerPosition;
  onHistoryClick: () => void;
  onLensToggle: () => void;
  onChatToggle?: () => void;
  onEditorToggle?: () => void;
  onAITriggerClick: () => void;
  onDismissInlineAI: () => void;
  onAIResponse: (responseText: string) => void;
}

export function EditorLayout({
  editor,
  documentId,
  provider,
  model,
  mainRef,
  scrollAreaRef,
  proseAreaRef,
  hasContent,
  showLens,
  chatOpen,
  editorOpen,
  showInlineAI,
  selection,
  triggerPosition,
  onHistoryClick,
  onLensToggle,
  onChatToggle,
  onEditorToggle,
  onAITriggerClick,
  onDismissInlineAI,
  onAIResponse,
}: EditorLayoutProps) {
  return (
    <main
      ref={mainRef}
      id="editor-content"
      tabIndex={-1}
      className="relative flex h-full w-full flex-col outline-none"
      role="main"
      data-testid="editor-main"
    >
      <Toolbar
        editor={editor}
        onHistoryClick={onHistoryClick}
        showLens={showLens}
        onLensToggle={onLensToggle}
        chatOpen={chatOpen}
        onChatToggle={onChatToggle}
        editorOpen={editorOpen}
        onEditorCollapse={onEditorToggle}
      />
      <div
        ref={scrollAreaRef}
        className="flex-1 cursor-text overflow-auto"
        onClick={(event) => {
          if (
            (event.target === scrollAreaRef.current || event.target === proseAreaRef.current) &&
            !editor?.state.selection.content().size
          ) {
            editor?.chain().focus("end").run();
          }
        }}
      >
        <div ref={proseAreaRef} className="mx-auto max-w-4xl px-8 py-8">
          <EditorContent
            editor={editor}
            data-testid="editor-surface"
            className="prose prose-neutral dark:prose-invert max-w-none focus-within:outline-none [&_.tiptap]:min-h-[60vh] [&_.tiptap]:outline-none"
          />
        </div>
      </div>

      {hasContent && (
        <button
          type="button"
          onMouseDown={(event) => {
            event.preventDefault();
          }}
          onClick={onAITriggerClick}
          className="absolute z-40 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-violet-200 bg-background text-violet-600 shadow-sm transition-colors hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-provenance-500"
          style={{
            top: `${triggerPosition.top}px`,
            left: `${triggerPosition.left}px`,
          }}
          aria-label={
            selection?.text.trim()
              ? "Modify selected text with AI"
              : "AI assistant"
          }
          title={
            selection?.text.trim()
              ? "Modify selected text"
              : "AI assistant"
          }
          data-testid="inline-ai-trigger"
        >
          <Sparkle className="h-4 w-4" />
        </button>
      )}

      {showInlineAI && selection && editor && (
        <InlineAI
          editor={editor}
          documentId={documentId}
          provider={provider}
          model={model}
          selectedText={selection.text}
          selectionFrom={selection.from}
          selectionTo={selection.to}
          anchorTop={triggerPosition.top}
          anchorRight={triggerPosition.right}
          onDismiss={onDismissInlineAI}
          onAIResponse={onAIResponse}
        />
      )}
    </main>
  );
}
