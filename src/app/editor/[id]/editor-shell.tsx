"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Editor } from "@/components/editor/Editor";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useSession } from "@/hooks/useSession";
import { SaveIndicator } from "@/components/editor/SaveIndicator";
import { BackLink } from "@/components/ui/BackLink";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ThreadSummary {
  id: string;
  title: string;
  messageCount: number | null;
  updatedAt: Date | null;
}

interface EditorShellProps {
  documentId: string;
  initialTitle: string;
  initialContent: Record<string, unknown>;
  aiProvider: string;
  aiModel: string | null;
  initialChatThreads?: ThreadSummary[];
}

export function EditorShell({ documentId, initialTitle, initialContent, aiProvider, aiModel, initialChatThreads = [] }: EditorShellProps) {
  const [title, setTitle] = useState(initialTitle);
  const [chatOpen, setChatOpen] = useState(true);
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

  useEffect(() => {
    if (!isDirty) return;
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#")) return;
      const confirmed = window.confirm("You have unsaved changes. Are you sure you want to leave?");
      if (!confirmed) { e.preventDefault(); e.stopPropagation(); }
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [isDirty, router]);

  return (
    <div>
      <nav className="mb-4 flex items-center gap-4" aria-label="Editor navigation">
        <BackLink href="/dashboard" />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 border-b border-transparent bg-transparent text-2xl font-bold outline-none focus:border-border"
          placeholder="Untitled"
        />
        <SaveIndicator status={status} onRetry={retry} />
        <Button variant="provenance" size="sm" asChild>
          <Link href={`/editor/${documentId}/preview`}>
            Generate Badge
          </Link>
        </Button>
      </nav>
      <Editor
        content={initialContent}
        documentId={documentId}
        title={title}
        provider={aiProvider}
        model={aiModel ?? undefined}
        onUpdate={handleUpdate}
        chatOpen={chatOpen}
        onChatToggle={() => setChatOpen((v) => !v)}
        initialChatThreads={initialChatThreads}
      />
    </div>
  );
}
