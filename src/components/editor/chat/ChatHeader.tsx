"use client";

import { X } from "lucide-react";
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
    <div className="flex min-h-12 items-center gap-1.5 border-b border-gray-200 bg-gray-50 px-3 py-2">
      {/* Left group */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          AI
        </span>

        {/* Mode segmented control (mockup: gray-200 bg, white active pill) */}
        <div className="flex gap-px rounded-md bg-gray-200 p-0.5">
          <button
            type="button"
            className="rounded bg-white px-2.5 py-0.5 text-[11px] font-medium text-gray-800 shadow-sm"
          >
            Ask
          </button>
          <button
            type="button"
            disabled
            className="rounded px-2.5 py-0.5 text-[11px] font-medium text-gray-400"
            title="Edit mode coming soon"
          >
            Edit
          </button>
        </div>

        {/* Thread dropdown (only when threads exist) */}
        {threads.length > 0 && (
          <>
            <span className="text-xs text-gray-300">·</span>
            <select
              value={activeThreadId ?? ""}
              onChange={(e) => onThreadSelect(e.target.value || null)}
              className="max-w-[140px] truncate rounded bg-transparent py-0.5 pl-1 pr-0.5 text-xs font-medium text-gray-500 outline-none hover:bg-gray-200 hover:text-gray-700"
            >
              <option value="">New chat</option>
              {threads.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </>
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
          className="max-w-[150px] truncate rounded border border-gray-200 bg-white px-2 py-0.5 text-[11px] text-gray-500 outline-none"
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

        <button
          type="button"
          onClick={onNewThread}
          className="flex h-7 items-center gap-1 rounded px-1.5 text-[11px] font-medium text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
          title="New thread"
        >
          + New
        </button>

        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
          aria-label="Close panel"
          title="Close panel"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
