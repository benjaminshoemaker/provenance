"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useCompletion } from "@ai-sdk/react";
import type { Editor } from "@tiptap/react";
import { nanoid } from "nanoid";
import { logAIInteraction } from "@/app/actions/ai-interactions";
import { TrackChangesDiff } from "./TrackChangesDiff";
import { Sparkles } from "lucide-react";

const PRESETS = [
  { label: "Rephrase", prompt: "Rephrase this text while keeping the same meaning" },
  { label: "Shorten", prompt: "Shorten this text to be more concise" },
  { label: "Elaborate", prompt: "Elaborate on this text with more detail" },
  { label: "More formal", prompt: "Rewrite this text in a more formal tone" },
  { label: "More casual", prompt: "Rewrite this text in a more casual tone" },
  { label: "Bulletize", prompt: "Convert this text into bullet points" },
  { label: "Summarize", prompt: "Summarize this text concisely" },
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

type Stage = "icon" | "menu" | "suggestion";

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
  const [stage, setStage] = useState<Stage>("icon");
  const [promptText, setPromptText] = useState("");
  const [lastPrompt, setLastPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const refineInputRef = useRef<HTMLInputElement>(null);

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
      setStage("suggestion");
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

  const handleRefine = useCallback(
    async (refinement: string) => {
      if (!refinement.trim()) return;
      setError(null);
      setLastPrompt(refinement);
      await complete(refinement, {
        body: {
          mode: "inline",
          provider,
          model,
          selectedText: completion || selectedText,
        },
      });
    },
    [complete, provider, model, completion, selectedText]
  );

  // Keyboard shortcuts: Escape to dismiss, Tab to accept (when suggestion shown)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleReject();
      }
      if (e.key === "Tab" && stage === "suggestion" && completion && !isLoading) {
        e.preventDefault();
        handleAccept();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stage, completion, isLoading, handleReject, handleAccept]);

  // Stage 1: Floating margin icon
  if (stage === "icon") {
    return (
      <div className="absolute right-4 top-1/2 z-50">
        <button
          onClick={() => setStage("menu")}
          className="flex h-8 w-8 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-accent"
          aria-label="AI suggestions"
          data-testid="inline-ai-icon"
        >
          <Sparkles className="h-4 w-4 text-violet-500" />
        </button>
      </div>
    );
  }

  // Stage 2: Action menu with presets + custom prompt
  if (stage === "menu") {
    return (
      <div className="floating-toolbar absolute z-50 mt-1 w-full max-w-sm rounded-lg border bg-background p-3 shadow-lg" data-testid="inline-ai-menu">
        <div className="mb-2 text-xs text-muted-foreground">
          Selected: &ldquo;
          {selectedText.slice(0, 50)}
          {selectedText.length > 50 ? "..." : ""}
          &rdquo;
        </div>

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
            placeholder="Modify with a prompt..."
            className="w-full rounded-md border px-2 py-1 text-sm"
            autoFocus
          />
        </form>

        <div className="mt-2 flex justify-end">
          <button
            onClick={handleReject}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Stage 3: Suggestion card with diff + Refine/Insert
  return (
    <div className="floating-toolbar absolute z-50 mt-1 w-full max-w-lg rounded-lg border bg-background p-3 shadow-lg" data-testid="inline-ai-suggestion">
      {isLoading && !completion && (
        <div className="text-sm text-muted-foreground">Generating...</div>
      )}

      {error && !isLoading && (
        <div className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
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
        <>
          <div className="mb-3 rounded-md border p-3 text-sm">
            <TrackChangesDiff original={selectedText} suggestion={completion} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const value = refineInputRef.current?.value;
              if (value?.trim()) {
                handleRefine(value);
                refineInputRef.current!.value = "";
              }
            }}
            className="mb-3"
          >
            <input
              ref={refineInputRef}
              placeholder="Refine with a prompt..."
              className="w-full rounded-md border px-2 py-1 text-sm"
            />
          </form>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const value = refineInputRef.current?.value;
                if (value?.trim()) handleRefine(value);
              }}
              className="rounded-md border px-3 py-1 text-sm hover:bg-accent"
            >
              Refine
            </button>
            <button
              onClick={handleAccept}
              className="rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground hover:bg-primary/90"
              aria-label="Insert"
            >
              Insert
              <kbd className="ml-1 rounded border border-primary-foreground/30 px-1 text-[10px]">Tab</kbd>
            </button>
            <button
              onClick={handleReject}
              className="rounded-md border px-3 py-1 text-sm hover:bg-accent"
              aria-label="Reject"
            >
              Reject
              <kbd className="ml-1 rounded border px-1 text-[10px] text-muted-foreground">Esc</kbd>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
