"use client";

import { useState, useEffect, useCallback } from "react";
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
import { SidePanel } from "./SidePanel";
import { FreeformAI } from "./FreeformAI";

interface EditorProps {
  content: Record<string, unknown>;
  documentId: string;
  title: string;
  provider?: string;
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
}: EditorProps) {
  const [selection, setSelection] = useState<TextSelection | null>(null);
  const [showFreeform, setShowFreeform] = useState(false);
  const [recentAIResponses] = useState<string[]>(() => []);
  const { updateContent } = useRevisions({ documentId });

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
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
      Image.configure({
        inline: false,
      }),
      OriginMark,
      PasteHandler.configure({
        documentId,
        onExternalPaste: handleExternalPaste,
        recentAIResponses,
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
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

  return (
    <div className="flex gap-4">
      <div className="relative flex-1 rounded-lg border">
        <Toolbar editor={editor} />
        <EditorContent
          editor={editor}
          className="prose prose-neutral dark:prose-invert max-w-none p-4 focus-within:outline-none [&_.tiptap]:min-h-[60vh] [&_.tiptap]:outline-none"
        />
        {selection && editor && (
          <InlineAI
            editor={editor}
            documentId={documentId}
            provider={provider}
            selectedText={selection.text}
            selectionFrom={selection.from}
            selectionTo={selection.to}
            onDismiss={handleDismissInlineAI}
          />
        )}
      </div>
      <SidePanel
        documentId={documentId}
        provider={provider}
        documentContent={content}
      />
      {showFreeform && (
        <FreeformAI
          documentId={documentId}
          provider={provider}
          documentContent={content}
          onClose={() => setShowFreeform(false)}
        />
      )}
    </div>
  );
}
