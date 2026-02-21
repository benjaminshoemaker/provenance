"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useCompletion } from "@ai-sdk/react";
import { logAIInteraction } from "@/app/actions/ai-interactions";

// freeform command palette for AI prompts
interface FreeformAIProps {
  documentId: string;
  provider: string;
  documentContent: Record<string, unknown>;
  onClose: () => void;
}

export function FreeformAI({
  documentId,
  provider,
  documentContent,
  onClose,
}: FreeformAIProps) {
  const [promptText, setPromptText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { completion, complete, isLoading, setCompletion } = useCompletion({
    api: "/api/ai/complete",
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!promptText.trim() || isLoading) return;

      const context = JSON.stringify(documentContent);
      await complete(promptText, {
        body: {
          mode: "freeform",
          provider,
          context,
        },
      });
    },
    [promptText, isLoading, complete, provider, documentContent]
  );

  const handleCopy = useCallback(async () => {
    if (!completion) return;
    await navigator.clipboard.writeText(completion);

    await logAIInteraction({
      documentId,
      mode: "freeform",
      prompt: promptText,
      response: completion,
      action: "accepted",
      provider,
      model: "",
    });

    setCompletion("");
    onClose();
  }, [completion, documentId, promptText, provider, setCompletion, onClose]);

  const handleDismiss = useCallback(() => {
    setCompletion("");
    onClose();
  }, [setCompletion, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[20vh]">
      <div className="w-full max-w-lg rounded-lg border bg-background shadow-2xl">
        <form onSubmit={handleSubmit} className="p-4">
          <input
            ref={inputRef}
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Ask AI anything about your document..."
            className="w-full rounded-md border px-3 py-2 text-sm"
            disabled={isLoading}
          />
        </form>

        {completion && (
          <div className="border-t p-4">
            <div className="mb-3 max-h-60 overflow-y-auto rounded-md bg-muted p-3 text-sm">
              {completion}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleDismiss}
                className="rounded-md border px-3 py-1 text-sm hover:bg-accent"
              >
                Dismiss
              </button>
              <button
                onClick={handleCopy}
                className="rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground hover:bg-primary/90"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        {isLoading && !completion && (
          <div className="border-t p-4 text-sm text-muted-foreground">
            Generating...
          </div>
        )}
      </div>
    </div>
  );
}
