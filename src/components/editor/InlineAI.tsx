"use client";

import { useState, useCallback } from "react";
import { useCompletion } from "@ai-sdk/react";
import type { Editor } from "@tiptap/react";
import { nanoid } from "nanoid";
import { logAIInteraction } from "@/app/actions/ai-interactions";

const PRESETS = [
  {
    label: "Improve",
    prompt: "Improve this text while keeping the same meaning",
  },
  {
    label: "Simplify",
    prompt: "Simplify this text to be clearer and more concise",
  },
  { label: "Expand", prompt: "Expand this text with more detail" },
  {
    label: "Fix Grammar",
    prompt: "Fix any grammar and spelling errors in this text",
  },
];

interface InlineAIProps {
  editor: Editor;
  documentId: string;
  provider: string;
  model?: string;
  selectedText: string;
  selectionFrom: number;
  selectionTo: number;
  onDismiss: () => void;
  onAIResponse?: (responseText: string) => void;
}

export function InlineAI({
  editor,
  documentId,
  provider,
  model,
  selectedText,
  selectionFrom,
  selectionTo,
  onDismiss,
  onAIResponse,
}: InlineAIProps) {
  const [promptText, setPromptText] = useState("");
  const [lastPrompt, setLastPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { completion, complete, isLoading, setCompletion, stop } =
    useCompletion({
      api: "/api/ai/complete",
      onError: (err) => {
        const message = err.message || "AI request failed";
        if (message.includes("429") || message.includes("rate limit")) {
          setError("Rate limit exceeded. Please wait a moment and retry.");
        } else if (message.includes("502") || message.includes("503")) {
          setError("AI provider is temporarily unavailable. Please retry.");
        } else {
          setError("Something went wrong. Please try again.");
        }
      },
    });

  const handleSubmit = useCallback(
    async (prompt: string) => {
      setLastPrompt(prompt);
      setError(null);
      await complete(prompt, {
        body: {
          mode: "inline",
          provider,
          model,
          selectedText,
        },
      });
    },
    [complete, provider, model, selectedText]
  );

  const handleAccept = useCallback(async () => {
    if (!completion) return;

    const sourceId = nanoid();

    editor
      .chain()
      .focus()
      .insertContentAt({ from: selectionFrom, to: selectionTo }, [
        {
          type: "text",
          text: completion,
          marks: [
            {
              type: "origin",
              attrs: {
                type: "ai",
                sourceId,
                originalLength: completion.length,
                originalText: completion,
              },
            },
          ],
        },
      ])
      .run();

    await logAIInteraction({
      documentId,
      mode: "inline",
      prompt: lastPrompt,
      selectedText,
      response: completion,
      action: "accepted",
      provider,
      model: model ?? "",
      charactersInserted: completion.length,
    });

    onAIResponse?.(completion);
    setCompletion("");
    onDismiss();
  }, [
    editor,
    completion,
    selectionFrom,
    selectionTo,
    documentId,
    lastPrompt,
    selectedText,
    provider,
    model,
    onAIResponse,
    setCompletion,
    onDismiss,
  ]);

  // reject and dismiss the suggestion
  const handleReject = useCallback(() => {
    if (isLoading) stop();

    if (completion) {
      void logAIInteraction({
        documentId,
        mode: "inline",
        prompt: lastPrompt,
        selectedText,
        response: completion,
        action: "rejected",
        provider,
        model: model ?? "",
        charactersInserted: 0,
      });
    }

    setCompletion("");
    onDismiss();
  }, [isLoading, stop, completion, documentId, lastPrompt, selectedText, provider, model, setCompletion, onDismiss]);

  return (
    // floating selection toolbar
    <div className="floating-toolbar absolute z-50 mt-1 w-full max-w-lg rounded-lg border bg-background p-3 shadow-lg">
      <div className="mb-2 text-xs text-muted-foreground">
        Selected: &ldquo;
        {selectedText.slice(0, 50)}
        {selectedText.length > 50 ? "..." : ""}
        &rdquo;
      </div>

      {!completion && !isLoading && (
        <>
          <div className="mb-2 flex flex-wrap gap-1">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handleSubmit(preset.prompt)}
                className="rounded-md border px-2 py-1 text-xs hover:bg-accent"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (promptText.trim()) handleSubmit(promptText);
            }}
          >
            <input
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Custom instruction..."
              className="w-full rounded-md border px-2 py-1 text-sm"
            />
          </form>
        </>
      )}

      {isLoading && !completion && (
        <div className="text-sm text-muted-foreground">Generating...</div>
      )}

      {error && !isLoading && (
        <div className="mt-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
          <p>{error}</p>
          <button
            onClick={() => lastPrompt && handleSubmit(lastPrompt)}
            className="mt-1 font-medium underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {completion && (
        <div className="mt-2">
          <div className="rounded-md bg-muted p-2 text-sm whitespace-pre-wrap">
            {completion}
          </div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleAccept}
              className="rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground hover:bg-primary/90"
              aria-label="Accept"
            >
              Accept
            </button>
            <button
              onClick={handleReject}
              className="rounded-md border px-3 py-1 text-sm hover:bg-accent"
              aria-label="Reject"
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
