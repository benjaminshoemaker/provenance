"use client";

import { useState, useCallback } from "react";
import { Editor } from "@/components/editor/Editor";
import { useAutoSave } from "@/hooks/useAutoSave";
import { SaveIndicator } from "@/components/editor/SaveIndicator";

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
  const { save, status } = useAutoSave({ documentId, title });

  const handleUpdate = useCallback(
    (json: Record<string, unknown>) => {
      save(json);
    },
    [save]
  );

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 border-b border-transparent bg-transparent text-3xl font-bold outline-none focus:border-border"
          placeholder="Untitled"
        />
        <SaveIndicator status={status} />
      </div>

      <Editor
        content={initialContent}
        documentId={documentId}
        title={title}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
