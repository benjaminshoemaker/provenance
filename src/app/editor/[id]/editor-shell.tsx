"use client";

import { useState, useCallback } from "react";
import { Editor } from "@/components/editor/Editor";

interface EditorShellProps {
  documentId: string;
  initialTitle: string;
  initialContent: Record<string, unknown>;
}

export function EditorShell({
  documentId,
  initialTitle,
  initialContent,
}: EditorShellProps) {
  const [title, setTitle] = useState(initialTitle);

  const handleUpdate = useCallback((_json: Record<string, unknown>) => {
    // Auto-save will be wired in Task 2.2.A
  }, []);

  return (
    <div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="mb-4 w-full border-b border-transparent bg-transparent text-3xl font-bold outline-none focus:border-border"
        placeholder="Untitled"
      />

      <Editor
        content={initialContent}
        documentId={documentId}
        title={title}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
