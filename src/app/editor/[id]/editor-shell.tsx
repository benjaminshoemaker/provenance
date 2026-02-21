"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Editor } from "@/components/editor/Editor";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useSession } from "@/hooks/useSession";
import { SaveIndicator } from "@/components/editor/SaveIndicator";

interface EditorShellProps {
  documentId: string;
  initialTitle: string;
  initialContent: Record<string, unknown>;
  aiProvider: string;
  aiModel: string | null;
}

export function EditorShell({
  documentId,
  initialTitle,
  initialContent,
  aiProvider,
  aiModel,
}: EditorShellProps) {
  const [title, setTitle] = useState(initialTitle);
  const { save, status, retry, isDirty } = useAutoSave({ documentId, title });
  const { markActive } = useSession({ documentId });
  const router = useRouter();

  const handleUpdate = useCallback(
    (json: Record<string, unknown>) => {
      markActive();
      save(json);
    },
    [save, markActive]
  );

  // Intercept in-app navigation when there are unsaved changes
  useEffect(() => {
    if (!isDirty) return;

    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#")) return;

      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?"
      );
      if (!confirmed) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [isDirty, router]);

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 border-b border-transparent bg-transparent text-3xl font-bold outline-none focus:border-border"
          placeholder="Untitled"
        />
        <SaveIndicator status={status} onRetry={retry} />
      </div>

      <Editor
        content={initialContent}
        documentId={documentId}
        title={title}
        provider={aiProvider}
        model={aiModel ?? undefined}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
