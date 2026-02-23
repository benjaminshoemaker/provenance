"use client";

import { useRef, useCallback, useEffect } from "react";
import { ArrowUp, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  wordCount?: number;
  documentTitle?: string;
  hasMessages?: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  isStreaming,
  disabled,
  wordCount,
  documentTitle,
  hasMessages,
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
    <div className="border-t border-border px-4 py-3">
      {/* Context chip — only shown when document has content */}
      {wordCount != null && wordCount > 0 && (
        <div className="mb-2 inline-flex items-center gap-1.5 rounded border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
          {`Full document · ${wordCount!.toLocaleString()} words`}
        </div>
      )}

      {/* Input wrapper */}
      <div className="flex items-end gap-2 rounded-lg border border-border bg-white px-3 py-2 transition-colors focus-within:border-provenance-500 focus-within:shadow-[0_0_0_3px_rgba(76,110,245,0.08)]">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your writing..."
          rows={1}
          disabled={disabled}
          className="flex-1 resize-none bg-transparent text-sm leading-snug text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50"
        />
        {isStreaming ? (
          <Button
            variant="provenance"
            size="icon-xs"
            onClick={onStop}
            aria-label="Stop generating"
          >
            <Square className="h-3 w-3" />
          </Button>
        ) : (
          <Button
            variant="provenance"
            size="icon-xs"
            onClick={onSubmit}
            disabled={disabled || !value.trim()}
            aria-label="Send message"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Keyboard hints — hidden once conversation starts */}
      {!hasMessages && (
        <div className="mt-1.5 flex gap-2 px-0.5 text-xs text-muted-foreground">
          <span>
            <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
              ⌘ L
            </kbd>{" "}
            toggle
          </span>
          <span>
            <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
              Enter
            </kbd>{" "}
            send
          </span>
        </div>
      )}
    </div>
  );
}
