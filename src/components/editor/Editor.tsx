"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { OriginMark } from "@/extensions/origin-mark";
import { PasteHandler } from "@/extensions/paste-handler";
import { logPasteEvent } from "@/app/actions/paste-events";
import { useRevisions } from "@/hooks/useRevisions";
import { Toolbar } from "./Toolbar";
import { InlineAI } from "./InlineAI";
import { FreeformAI } from "./FreeformAI";
import { TimelineModal } from "./TimelineModal";

interface EditorProps {
  content: Record<string, unknown>;
  documentId: string;
  title: string;
  provider?: string;
  model?: string;
  onUpdate?: (json: Record<string, unknown>) => void;
}

interface TextSelection {
  text: string;
  from: number;
  to: number;
}

export function Editor({
  content,
  documentId,
  onUpdate,
  provider = "anthropic",
  model,
}: EditorProps) {
  const [selection, setSelection] = useState<TextSelection | null>(null);
  const [showFreeform, setShowFreeform] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const { updateContent, createAIRevision } = useRevisions({ documentId });
  const contentRef = useRef<Record<string, unknown>>(content);

  const getDocumentContent = useCallback(() => contentRef.current, []);

  const handleExternalPaste = useCallback(
    (pastedContent: string, characterCount: number) => {
      logPasteEvent({
        documentId,
        content: pastedContent,
        sourceType: "external",
        characterCount,
      });
    },
    [documentId]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
      Image.configure({ inline: false }),
      OriginMark,
      PasteHandler.configure({
        documentId,
        onExternalPaste: handleExternalPaste,
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      contentRef.current = json;
      onUpdate?.(json);
      updateContent(json);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const handleSelectionUpdate = () => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        const text = editor.state.doc.textBetween(from, to);
        setSelection({ text, from, to });
      } else {
        setSelection(null);
      }
    };
    editor.on("selectionUpdate", handleSelectionUpdate);
    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate);
    };
  }, [editor]);

  const handleDismissInlineAI = useCallback(() => {
    setSelection(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowFreeform((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleAIResponse = useCallback(
    (responseText: string) => {
      if (!editor) return;
      if (!responseText.trim()) return;
      editor.commands.addRecentAIResponse?.(responseText);
      void createAIRevision();
    },
    [editor, createAIRevision]
  );

  return (
    <main className="relative flex h-[calc(100vh-8rem)] w-full flex-col rounded-lg border" role="main">
      <div className="border-b">
        <Toolbar editor={editor} onHistoryClick={() => setShowTimeline(true)} />
      </div>
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-3xl px-16 py-8">
          <EditorContent
            editor={editor}
            className="prose prose-neutral dark:prose-invert max-w-none focus-within:outline-none [&_.tiptap]:min-h-[60vh] [&_.tiptap]:outline-none"
          />
        </div>
      </div>
      {selection && editor && (
        <InlineAI
          editor={editor}
          documentId={documentId}
          provider={provider}
          model={model}
          selectedText={selection.text}
          selectionFrom={selection.from}
          selectionTo={selection.to}
          onDismiss={handleDismissInlineAI}
          onAIResponse={handleAIResponse}
        />
      )}
      {showFreeform && (
        <FreeformAI
          documentId={documentId}
          provider={provider}
          model={model}
          getDocumentContent={getDocumentContent}
          onAIResponse={handleAIResponse}
          onClose={() => setShowFreeform(false)}
        />
      )}
      <TimelineModal
        documentId={documentId}
        isOpen={showTimeline}
        onClose={() => setShowTimeline(false)}
      />
    </main>
  );
}
