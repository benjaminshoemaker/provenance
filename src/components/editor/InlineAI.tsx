"use client";

import { useState, useCallback, useEffect } from "react";
import { useCompletion } from "@ai-sdk/react";
import type { Editor } from "@tiptap/react";
import { nanoid } from "nanoid";
import { logAIInteraction } from "@/app/actions/ai-interactions";
import { Sparkles, Check } from "lucide-react";

const PRESETS = [
  { label: "Improve", prompt: "Improve this text while keeping the same meaning" },
  { label: "Simplify", prompt: "Simplify this text to be more concise and clear" },
  { label: "Expand", prompt: "Expand on this text with more detail" },
  { label: "Fix", prompt: "Fix grammar, spelling, and clarity issues in this text" },
  { label: "More formal", prompt: "Rewrite this text in a more formal tone" },
  { label: "More casual", prompt: "Rewrite this text in a more casual tone" },
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

type Stage = "toolbar" | "choosing";

interface Choice {
  id: string;
  label: string;
  sublabel?: string;
  text: string;
  isOriginal: boolean;
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
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
  const [stage, setStage] = useState<Stage>("toolbar");
  const [promptText, setPromptText] = useState("");
  const [lastPrompt, setLastPrompt] = useState("");
  const [activeAction, setActiveAction] = useState("");
  const [selectedChoiceId, setSelectedChoiceId] = useState("original");
  const [choices, setChoices] = useState<Choice[]>([]);
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

  // Build choices when completion arrives
  useEffect(() => {
    if (!completion) return;
    const originalWords = wordCount(selectedText);
    const suggestionWords = wordCount(completion);
    const diff = originalWords - suggestionWords;
    const sublabel =
      diff > 0
        ? `· ${diff} fewer word${diff !== 1 ? "s" : ""}`
        : diff < 0
          ? `· ${Math.abs(diff)} more word${Math.abs(diff) !== 1 ? "s" : ""}`
          : undefined;

    setChoices([
      {
        id: "original",
        label: "YOUR ORIGINAL",
        text: selectedText,
        isOriginal: true,
      },
      {
        id: "suggestion-1",
        label: "SUGGESTION 1",
        sublabel,
        text: completion,
        isOriginal: false,
      },
    ]);
  }, [completion, selectedText]);

  const handleSubmit = useCallback(
    async (prompt: string, actionName: string) => {
      setLastPrompt(prompt);
      setActiveAction(actionName);
      setError(null);
      setStage("choosing");
      setSelectedChoiceId("original"); // Original starts selected
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

  const handleConfirm = useCallback(async () => {
    const selected = choices.find((c) => c.id === selectedChoiceId);
    if (!selected) return;

    if (selected.isOriginal) {
      // Kept original — log as rejected, no editor change
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
      return;
    }

    // Accepted AI suggestion
    const sourceId = nanoid();
    editor
      .chain()
      .focus()
      .insertContentAt({ from: selectionFrom, to: selectionTo }, [
        {
          type: "text",
          text: selected.text,
          marks: [
            {
              type: "origin",
              attrs: {
                type: "ai",
                sourceId,
                originalLength: selected.text.length,
                originalText: selected.text,
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
      response: selected.text,
      action: "accepted",
      provider,
      model: model ?? "",
      charactersInserted: selected.text.length,
    });

    onAIResponse?.(selected.text);
    setCompletion("");
    onDismiss();
  }, [
    choices,
    selectedChoiceId,
    completion,
    editor,
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

  const handleDismiss = useCallback(() => {
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

  // Keyboard: ↑↓ navigate, Enter confirm, Escape dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleDismiss();
        return;
      }

      if (stage === "choosing" && choices.length > 0) {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          e.preventDefault();
          const idx = choices.findIndex((c) => c.id === selectedChoiceId);
          const next =
            e.key === "ArrowDown"
              ? (idx + 1) % choices.length
              : (idx - 1 + choices.length) % choices.length;
          setSelectedChoiceId(choices[next].id);
        }
        if (e.key === "Enter" && !isLoading) {
          e.preventDefault();
          handleConfirm();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stage, choices, selectedChoiceId, isLoading, handleDismiss, handleConfirm]);

  // Stage 1: Floating toolbar with presets
  if (stage === "toolbar") {
    return (
      <div
        className="floating-toolbar absolute z-50 mt-1 w-full max-w-md rounded-lg border bg-background p-3 shadow-lg"
        data-testid="inline-ai-toolbar"
      >
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-violet-500" />
          <span>
            Selection · {wordCount(selectedText)} word{wordCount(selectedText) !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="mb-2 flex flex-wrap gap-1">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handleSubmit(preset.prompt, preset.label)}
              className="rounded-md border px-2 py-1 text-xs hover:bg-accent"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (promptText.trim()) handleSubmit(promptText, "Custom");
          }}
        >
          <input
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Custom prompt..."
            className="w-full rounded-md border px-2 py-1 text-sm"
            autoFocus
          />
        </form>

        <div className="mt-2 flex justify-end">
          <button
            onClick={handleDismiss}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Stage 2: Card-based selection — "choose among equals"
  const sentenceCount = selectedText.split(/[.!?]+/).filter((s) => s.trim()).length;

  return (
    <div
      className="floating-toolbar absolute z-50 mt-1 w-full max-w-lg overflow-hidden rounded-xl border bg-background shadow-lg"
      data-testid="inline-ai-chooser"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-2">
        <div className="flex items-center gap-2 text-sm">
          <Sparkles className="h-3.5 w-3.5 text-violet-500" />
          <span className="font-medium">{activeAction}</span>
          <span className="text-muted-foreground">
            · Selection · {sentenceCount} sentence{sentenceCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Choice cards */}
      <div className="p-3 space-y-2">
        {isLoading && choices.length === 0 && (
          <div className="py-4 text-center text-sm text-muted-foreground">
            Generating suggestion...
          </div>
        )}

        {error && !isLoading && (
          <div className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
            <p>{error}</p>
            <button
              onClick={() => lastPrompt && handleSubmit(lastPrompt, activeAction)}
              className="mt-1 font-medium underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {choices.map((choice) => {
          const isSelected = selectedChoiceId === choice.id;
          return (
            <button
              key={choice.id}
              onClick={() => setSelectedChoiceId(choice.id)}
              className={`relative w-full rounded-lg border-2 p-3 text-left text-sm transition-colors ${
                isSelected
                  ? "border-[#4c6ef5] bg-[#4c6ef5]/5"
                  : "border-gray-200 hover:border-violet-300"
              }`}
              data-testid={`choice-${choice.id}`}
            >
              {/* Selection checkmark */}
              {isSelected && (
                <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#4c6ef5] text-white">
                  <Check className="h-3 w-3" />
                </div>
              )}

              {/* Label */}
              <div className="mb-1 flex items-center gap-2">
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider ${
                    choice.isOriginal ? "text-gray-400" : "text-violet-500"
                  }`}
                >
                  {choice.label}
                </span>
                {choice.sublabel && (
                  <span className="text-[10px] text-gray-400">
                    {choice.sublabel}
                  </span>
                )}
              </div>

              {/* Text content */}
              <div className="whitespace-pre-wrap text-gray-700">
                {choice.text}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer bar */}
      {choices.length > 0 && (
        <div className="flex items-center justify-between border-t bg-gray-50 px-4 py-2">
          <span className="text-[10px] text-muted-foreground">
            <kbd className="rounded border px-1">↑↓</kbd> navigate ·{" "}
            <kbd className="rounded border px-1">Enter</kbd> confirm ·{" "}
            <kbd className="rounded border px-1">Esc</kbd> dismiss
          </span>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="rounded-md bg-primary px-3 py-1 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Confirm Selection
          </button>
        </div>
      )}
    </div>
  );
}
