"use client";

import { Plus, X } from "lucide-react";

interface ThreadSummary {
  id: string;
  title: string;
  messageCount: number | null;
  updatedAt: Date | null;
}

interface ChatHeaderProps {
  threads: ThreadSummary[];
  activeThreadId: string | null;
  onThreadSelect: (threadId: string | null) => void;
  onNewThread: () => void;
  onClose: () => void;
}

export function ChatHeader({
  threads,
  activeThreadId,
  onThreadSelect,
  onNewThread,
  onClose,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center gap-2 border-b px-3 py-2">
      <span className="text-xs font-semibold text-foreground">AI</span>

      {/* Mode segmented control */}
      <div className="flex rounded-md border text-[11px]">
        <button
          type="button"
          className="rounded-l-md bg-foreground px-2 py-0.5 text-background"
        >
          Ask
        </button>
        <button
          type="button"
          disabled
          className="rounded-r-md px-2 py-0.5 text-muted-foreground opacity-50"
          title="Edit mode coming soon"
        >
          Edit
        </button>
      </div>

      {/* Thread selector */}
      {threads.length > 0 && (
        <select
          value={activeThreadId ?? ""}
          onChange={(e) =>
            onThreadSelect(e.target.value || null)
          }
          className="ml-auto max-w-[120px] truncate rounded border bg-transparent px-1.5 py-0.5 text-[11px] text-muted-foreground outline-none"
        >
          <option value="">New chat</option>
          {threads.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      )}

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={onNewThread}
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="New thread"
          title="New thread"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Close panel"
          title="Close panel"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
