"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Editor } from "@/components/editor/Editor";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useSession } from "@/hooks/useSession";
import { SaveIndicator } from "@/components/editor/SaveIndicator";
import { BackLink } from "@/components/ui/BackLink";
import { Button } from "@/components/ui/button";
import { BadgeHistoryModal } from "@/components/editor/BadgeHistoryModal";
import { Clock } from "lucide-react";
import Link from "next/link";

const PANEL_STATE_VERSION = 1;

interface StoredPanelState {
  version: number;
  chatOpen: boolean;
  editorOpen: boolean;
}

function panelStateKey(documentId: string): string {
  return `provenance:editor:${documentId}:panels`;
}

function readPanelState(documentId: string): Pick<StoredPanelState, "chatOpen" | "editorOpen"> {
  if (typeof window === "undefined") {
    return { chatOpen: true, editorOpen: true };
  }

  try {
    const raw = window.localStorage.getItem(panelStateKey(documentId));
    if (!raw) return { chatOpen: true, editorOpen: true };
    const parsed = JSON.parse(raw) as Partial<StoredPanelState>;
    if (parsed.version !== PANEL_STATE_VERSION) {
      return { chatOpen: true, editorOpen: true };
    }
    const chatOpen = parsed.chatOpen !== false;
    const editorOpen = parsed.editorOpen !== false;
    if (!chatOpen && !editorOpen) {
      return { chatOpen: true, editorOpen: true };
    }
    return { chatOpen, editorOpen };
  } catch {
    return { chatOpen: true, editorOpen: true };
  }
}

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
  latestBadgeVerificationId?: string | null;
  badgeCount?: number;
  initialChatThreads?: ThreadSummary[];
}

export function EditorShell({
  documentId,
  initialTitle,
  initialContent,
  aiProvider,
  aiModel,
  latestBadgeVerificationId,
  badgeCount = 0,
  initialChatThreads = [],
}: EditorShellProps) {
  const [title, setTitle] = useState(initialTitle);
  const [showBadgeHistory, setShowBadgeHistory] = useState(false);
  const [chatOpen, setChatOpen] = useState(
    () => readPanelState(documentId).chatOpen
  );
  const [editorOpen, setEditorOpen] = useState(
    () => readPanelState(documentId).editorOpen
  );
  const { save, status, retry, isDirty } = useAutoSave({ documentId, title });
  const { markActive } = useSession({ documentId });
  const isDirtyRef = useRef(isDirty);

  isDirtyRef.current = isDirty;

  const handleUpdate = useCallback(
    (json: Record<string, unknown>) => {
      markActive();
      save(json);
    },
    [save, markActive]
  );

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!isDirtyRef.current) return;

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
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      panelStateKey(documentId),
      JSON.stringify({
        version: PANEL_STATE_VERSION,
        chatOpen,
        editorOpen,
      } satisfies StoredPanelState)
    );
  }, [documentId, chatOpen, editorOpen]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <a href="#editor-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow-md">
        Skip to editor
      </a>
      <nav className="flex shrink-0 items-center gap-3 border-b border-border px-2 py-1.5" aria-label="Editor navigation">
        <BackLink href="/dashboard" />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Document title"
          data-testid="document-title"
          className="flex-1 rounded-md bg-transparent px-1 text-lg font-semibold outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          placeholder="Untitled"
        />
        <SaveIndicator status={status} onRetry={retry} />
        {latestBadgeVerificationId && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/verify/${latestBadgeVerificationId}`}>
              View Badge
            </Link>
          </Button>
        )}
        {latestBadgeVerificationId && badgeCount > 1 && (
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setShowBadgeHistory(true)}
            aria-label="Badge history"
            title="Badge history"
          >
            <Clock className="h-4 w-4" />
          </Button>
        )}
        <Button variant="outline" size="sm" asChild>
          <Link href={`/editor/${documentId}/preview`} data-testid="generate-badge">
            Generate Badge
          </Link>
        </Button>
      </nav>
      <Editor
        content={initialContent}
        documentId={documentId}
        provider={aiProvider}
        model={aiModel ?? undefined}
        onUpdate={handleUpdate}
        chatOpen={chatOpen}
        onChatToggle={() => {
          if (!chatOpen || editorOpen) setChatOpen((v) => !v);
        }}
        editorOpen={editorOpen}
        onEditorToggle={() => {
          if (!editorOpen || chatOpen) setEditorOpen((v) => !v);
        }}
        initialChatThreads={initialChatThreads}
      />
      <BadgeHistoryModal
        documentId={documentId}
        isOpen={showBadgeHistory}
        onClose={() => setShowBadgeHistory(false)}
      />
    </div>
  );
}
