"use client";

import { useRef, useCallback, useEffect } from "react";
import { ArrowUp, Square } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  wordCount?: number;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  isStreaming,
  disabled,
  wordCount,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const maxHeight = 6 * 24; // ~6 lines
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!isStreaming && !disabled && value.trim()) {
          onSubmit();
        }
      }
    },
    [isStreaming, disabled, value, onSubmit]
  );

  return (
    <div className="border-t border-gray-200 px-4 py-3">
      {/* Context chip */}
      {wordCount != null && wordCount > 0 && (
        <div className="mb-2 inline-flex items-center gap-1.5 rounded border border-provenance-100 bg-provenance-50 px-2 py-0.5 text-[11px] font-medium text-provenance-700">
          <span className="h-1.5 w-1.5 rounded-full bg-provenance-500" />
          Full document · {wordCount.toLocaleString()} words
        </div>
      )}

      {/* Input wrapper */}
      <div className="flex items-end gap-2 rounded-[10px] border border-gray-200 bg-white px-3 py-2 transition-colors focus-within:border-provenance-500 focus-within:shadow-[0_0_0_3px_rgba(76,110,245,0.08)]">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your writing..."
          rows={1}
          disabled={disabled}
          className="flex-1 resize-none bg-transparent text-[13px] leading-snug text-gray-800 outline-none placeholder:text-gray-400 disabled:opacity-50"
        />
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-provenance-600 text-white transition-colors hover:bg-provenance-700"
            aria-label="Stop generating"
          >
            <Square className="h-3 w-3" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={disabled || !value.trim()}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-provenance-600 text-white transition-colors hover:bg-provenance-700 disabled:bg-gray-200 disabled:text-gray-400"
            aria-label="Send message"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Keyboard hints */}
      <div className="mt-1.5 flex gap-2 px-0.5 text-[11px] text-gray-400">
        <span>
          <kbd className="rounded border border-gray-200 bg-gray-50 px-1 py-px text-[10px] text-gray-500">
            ⌘ L
          </kbd>{" "}
          toggle
        </span>
        <span>
          <kbd className="rounded border border-gray-200 bg-gray-50 px-1 py-px text-[10px] text-gray-500">
            Enter
          </kbd>{" "}
          send
        </span>
      </div>
    </div>
  );
}
