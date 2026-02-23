"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { providers } from "@/lib/ai/providers";

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
  selectedProvider: string;
  selectedModel?: string;
  onModelChange: (provider: string, model: string) => void;
}

// Flatten all models across providers for the unified dropdown
function getAllModels() {
  return Object.values(providers).flatMap((p) =>
    p.models.map((m) => ({ ...m, provider: p.id, providerName: p.name }))
  );
}

export function ChatHeader({
  threads,
  activeThreadId,
  onThreadSelect,
  onNewThread,
  onClose,
  selectedProvider,
  selectedModel,
  onModelChange,
}: ChatHeaderProps) {
  const allModels = getAllModels();
  const currentModelId =
    selectedModel ?? providers[selectedProvider]?.defaultModel ?? "";

  return (
    <div className="flex min-h-12 items-center gap-1.5 border-b border-border bg-muted px-4 py-2">
      {/* Left group */}
      <div className="flex items-center gap-1.5">
        {threads.length > 0 ? (
          <select
            value={activeThreadId ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "") {
                onNewThread();
              } else {
                onThreadSelect(val);
              }
            }}
            aria-label="Select chat thread"
            className="max-w-[140px] cursor-pointer truncate rounded-md border border-border bg-background py-0.5 pl-2 pr-1 text-xs font-medium text-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <option value="">New chat</option>
            {threads.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-xs font-medium text-muted-foreground">New chat</span>
        )}
      </div>

      {/* Right group */}
      <div className="ml-auto flex items-center gap-1.5">
        {/* Model selector — all providers */}
        <select
          value={currentModelId}
          onChange={(e) => {
            const model = allModels.find((m) => m.id === e.target.value);
            if (model) onModelChange(model.provider, model.id);
          }}
          aria-label="Select AI model"
          className="max-w-[150px] cursor-pointer truncate rounded-md border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50"
          title="AI model"
        >
          {Object.values(providers).map((p) => (
            <optgroup key={p.id} label={p.name}>
              {p.models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onClose}
          aria-label="Close panel"
          title="Close panel"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
