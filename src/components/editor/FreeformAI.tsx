"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useCompletion } from "@ai-sdk/react";
import { logAIInteraction } from "@/app/actions/ai-interactions";

// freeform command palette for AI prompts
interface FreeformAIProps {
  documentId: string;
  provider: string;
  model?: string;
  getDocumentContent: () => Record<string, unknown>;
  onAIResponse?: (responseText: string) => void;
  onClose: () => void;
}

export function FreeformAI({
  documentId,
  provider,
  model,
  getDocumentContent,
  onAIResponse,
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

      const context = JSON.stringify(getDocumentContent());
      await complete(promptText, {
        body: {
          mode: "freeform",
          provider,
          model,
          context,
        },
      });
    },
    [promptText, isLoading, complete, provider, model, getDocumentContent]
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
      model: model ?? "",
    });

    onAIResponse?.(completion);

    setCompletion("");
    onClose();
  }, [
    completion,
    documentId,
    promptText,
    provider,
    model,
    setCompletion,
    onAIResponse,
    onClose,
  ]);

  const handleDismiss = useCallback(() => {
    if (completion) {
      void logAIInteraction({
        documentId,
        mode: "freeform",
        prompt: promptText,
        response: completion,
        action: "dismissed",
        provider,
        model: model ?? "",
      });
    }

    setCompletion("");
    onClose();
  }, [completion, documentId, promptText, provider, model, setCompletion, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[20vh]"
      data-testid="freeform-ai-modal"
    >
      <div className="w-full max-w-lg rounded-lg border bg-background shadow-lg">
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
                className="rounded-md border px-3 py-1 text-sm hover:bg-accent transition-colors duration-150"
              >
                Dismiss
              </button>
              <button
                onClick={handleCopy}
                className="rounded-md bg-provenance-600 px-3 py-1 text-sm text-white hover:bg-provenance-700 transition-colors duration-150"
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
