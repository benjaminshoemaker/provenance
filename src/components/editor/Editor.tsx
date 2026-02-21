"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Toolbar } from "./Toolbar";

interface EditorProps {
  content: Record<string, unknown>;
  documentId: string;
  title: string;
  onUpdate?: (json: Record<string, unknown>) => void;
}

export function Editor({ content, onUpdate }: EditorProps) {
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
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onUpdate?.(editor.getJSON());
    },
  });

  return (
    <div className="rounded-lg border">
      <Toolbar editor={editor} />
      <EditorContent
        editor={editor}
        className="prose prose-neutral dark:prose-invert max-w-none p-4 focus-within:outline-none [&_.tiptap]:min-h-[60vh] [&_.tiptap]:outline-none"
      />
    </div>
  );
}
