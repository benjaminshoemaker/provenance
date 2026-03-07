"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useCompletion } from "@ai-sdk/react";
import type { Editor } from "@tiptap/react";
import { logAIInteraction } from "@/app/actions/ai-interactions";
import { Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrackChangesDiff } from "./TrackChangesDiff";

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
  anchorTop?: number;
  anchorRight?: number;
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

function changeRatio(original: string, suggestion: string): number {
  const origWords = original.split(/\s+/).filter(Boolean);
  const suggWords = suggestion.split(/\s+/).filter(Boolean);
  const maxLen = Math.max(origWords.length, suggWords.length);
  if (maxLen === 0) return 0;
  // Count words in common using LCS length
  const m = origWords.length;
  const n = suggWords.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = origWords[i - 1] === suggWords[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const common = dp[m][n];
  return 1 - common / maxLen;
}

const DIFF_THRESHOLD = 0.25;

function createSourceId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const rand = Math.floor(Math.random() * 16);
    const value = char === "x" ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
}

function cleanSuggestionText(text: string): string {
  return text
    .replace(/^\s*(SUGGESTION|OPTION)\s*\d+\s*:\s*/i, "")
    .trim();
}

function parseSuggestions(rawCompletion: string): [string, string] {
  const completion = rawCompletion.trim();
  if (!completion) return ["", ""];

  const delimiterMatch = completion
    .split(/\n-{3,}\n/)
    .map((part) => cleanSuggestionText(part))
    .filter(Boolean);
  if (delimiterMatch.length >= 2) {
    return [delimiterMatch[0], delimiterMatch[1]];
  }

  const explicitMatch = completion.match(
    /SUGGESTION\s*1\s*:\s*([\s\S]*?)\n+\s*SUGGESTION\s*2\s*:\s*([\s\S]*)/i
  );
  if (explicitMatch) {
    return [
      cleanSuggestionText(explicitMatch[1]),
      cleanSuggestionText(explicitMatch[2]),
    ];
  }

  const blocks = completion
    .split(/\n{2,}/)
    .map((part) => cleanSuggestionText(part))
    .filter(Boolean);
  if (blocks.length >= 2) {
    return [blocks[0], blocks[1]];
  }

  return [cleanSuggestionText(completion), cleanSuggestionText(completion)];
}

function suggestionDeltaLabel(originalText: string, suggestionText: string): string | undefined {
  const originalWords = wordCount(originalText);
  const suggestionWords = wordCount(suggestionText);
  const diff = originalWords - suggestionWords;
  if (diff > 0) return `· ${diff} fewer word${diff !== 1 ? "s" : ""}`;
  if (diff < 0) return `· ${Math.abs(diff)} more word${Math.abs(diff) !== 1 ? "s" : ""}`;
  return undefined;
}

export function InlineAI({
  editor,
  documentId,
  provider,
  model,
  selectedText,
  selectionFrom,
  selectionTo,
  anchorTop = 96,
  anchorRight = 24,
  onDismiss,
  onAIResponse,
}: InlineAIProps) {
  const [stage, setStage] = useState<Stage>("toolbar");
  const [promptText, setPromptText] = useState("");
  const [lastPrompt, setLastPrompt] = useState("");
  const [activeAction, setActiveAction] = useState("");
  const [selectedChoiceId, setSelectedChoiceId] = useState("original");
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

  const choices = useMemo<Choice[]>(() => {
    if (!completion) return [];
    const [suggestionOne, suggestionTwo] = parseSuggestions(completion);

    return [
      {
        id: "original",
        label: "YOUR ORIGINAL",
        text: selectedText,
        isOriginal: true,
      },
      {
        id: "suggestion-1",
        label: "SUGGESTION 1",
        sublabel: suggestionDeltaLabel(selectedText, suggestionOne),
        text: suggestionOne,
        isOriginal: false,
      },
      {
        id: "suggestion-2",
        label: "SUGGESTION 2",
        sublabel: suggestionDeltaLabel(selectedText, suggestionTwo),
        text: suggestionTwo,
        isOriginal: false,
      },
    ];
  }, [completion, selectedText]);

  const handleSubmit = useCallback(
    async (prompt: string, actionName: string) => {
      setLastPrompt(prompt);
      setActiveAction(actionName);
      setError(null);
      setStage("choosing");
      setSelectedChoiceId("original"); // Original starts selected
      const dualSuggestionPrompt = `${prompt}

Return exactly TWO distinct rewritten options for the selected text.
Do not include explanations.
Use this format exactly:
SUGGESTION 1:
<text>
---
SUGGESTION 2:
<text>`;
      await complete(dualSuggestionPrompt, {
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
    const sourceId = createSourceId();

    await logAIInteraction({
      sourceId,
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
        className="floating-toolbar absolute z-50 w-[calc(100%-2rem)] max-w-md rounded-lg border bg-background p-3 shadow-lg"
        style={{ top: `${anchorTop + 36}px`, right: `${anchorRight}px` }}
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
            <Button
              key={preset.label}
              variant="outline"
              size="xs"
              onClick={() => handleSubmit(preset.prompt, preset.label)}
            >
              {preset.label}
            </Button>
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
            className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
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
      className="floating-toolbar absolute z-50 flex w-[calc(100%-2rem)] max-w-lg flex-col overflow-hidden rounded-xl border bg-background shadow-lg"
      style={{ top: `${anchorTop + 36}px`, right: `${anchorRight}px`, maxHeight: `calc(100% - ${anchorTop + 36}px - 8px)` }}
      data-testid="inline-ai-chooser"
    >
      {/* Header bar */}
      <div className="flex shrink-0 items-center justify-between border-b bg-muted px-4 py-2">
        <div className="flex items-center gap-2 text-sm">
          <Sparkles className="h-3.5 w-3.5 text-violet-500" />
          <span className="font-medium">{activeAction}</span>
          <span className="text-muted-foreground">
            · Selection · {sentenceCount} sentence{sentenceCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Choice cards */}
      <div className="min-h-0 overflow-y-auto p-3 space-y-2">
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
                  ? "border-provenance-500 bg-provenance-500/5"
                  : "border-border hover:border-violet-300"
              }`}
              data-testid={`choice-${choice.id}`}
            >
              {/* Selection checkmark */}
              {isSelected && (
                <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-provenance-500 text-white">
                  <Check className="h-3 w-3" />
                </div>
              )}

              {/* Label */}
              <div className="mb-1 flex items-center gap-2">
                <span
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    choice.isOriginal ? "text-muted-foreground" : "text-violet-500"
                  }`}
                >
                  {choice.label}
                </span>
                {choice.sublabel && (
                  <span className="text-xs text-muted-foreground">
                    {choice.sublabel}
                  </span>
                )}
              </div>

              {/* Text content — show inline diff only for light edits */}
              <div className="text-foreground">
                {choice.isOriginal || changeRatio(selectedText, choice.text) >= DIFF_THRESHOLD ? (
                  <span className="whitespace-pre-wrap">{choice.text}</span>
                ) : (
                  <TrackChangesDiff original={selectedText} suggestion={choice.text} />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer bar */}
      {choices.length > 0 && (
        <div className="flex shrink-0 items-center justify-between border-t bg-muted px-4 py-2">
          <span className="text-xs text-muted-foreground">
            <kbd className="rounded border px-1">↑↓</kbd> navigate ·{" "}
            <kbd className="rounded border px-1">Enter</kbd> confirm ·{" "}
            <kbd className="rounded border px-1">Esc</kbd> dismiss
          </span>
          <Button
            variant="provenance"
            size="sm"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            Confirm Selection
          </Button>
        </div>
      )}
    </div>
  );
}
