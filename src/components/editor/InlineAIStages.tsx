"use client";

import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrackChangesDiff } from "./TrackChangesDiff";
import { PRESETS, changeRatio, wordCount } from "./inline-ai-utils";

interface Choice {
  id: string;
  label: string;
  sublabel?: string;
  text: string;
  isOriginal: boolean;
}

const DIFF_THRESHOLD = 0.25;

interface InlineAIToolbarStageProps {
  anchorTop: number;
  anchorRight: number;
  selectedText: string;
  promptText: string;
  onPromptTextChange: (value: string) => void;
  onSubmit: (prompt: string, actionName: string) => void;
  onDismiss: () => void;
}

export function InlineAIToolbarStage({
  anchorTop,
  anchorRight,
  selectedText,
  promptText,
  onPromptTextChange,
  onSubmit,
  onDismiss,
}: InlineAIToolbarStageProps) {
  const selectionWordCount = wordCount(selectedText);

  return (
    <div
      className="floating-toolbar absolute z-50 w-[calc(100%-2rem)] max-w-md rounded-lg border bg-background p-3 shadow-lg"
      style={{ top: `${anchorTop + 36}px`, right: `${anchorRight}px` }}
      data-testid="inline-ai-toolbar"
    >
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-violet-500" />
        <span>
          Selection · {selectionWordCount} word{selectionWordCount !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="mb-2 flex flex-wrap gap-1">
        {PRESETS.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="xs"
            onClick={() => onSubmit(preset.prompt, preset.label)}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (promptText.trim()) onSubmit(promptText, "Custom");
        }}
      >
        <input
          value={promptText}
          onChange={(event) => onPromptTextChange(event.target.value)}
          placeholder="Custom prompt..."
          className="w-full rounded-md border px-2 py-1 text-sm"
          autoFocus
        />
      </form>

      <div className="mt-2 flex justify-end">
        <button
          onClick={onDismiss}
          className="text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

interface InlineAIChooserStageProps {
  anchorTop: number;
  anchorRight: number;
  selectedText: string;
  activeAction: string;
  choices: Choice[];
  selectedChoiceId: string;
  isLoading: boolean;
  error: string | null;
  lastPrompt: string;
  onRetry: () => void;
  onSelectChoice: (choiceId: string) => void;
  onConfirm: () => void;
  onDismiss: () => void;
}

function ChoiceCard({
  choice,
  selectedText,
  isSelected,
  onSelect,
}: {
  choice: Choice;
  selectedText: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      key={choice.id}
      onClick={onSelect}
      className={`relative w-full rounded-lg border-2 p-3 text-left text-sm transition-colors ${
        isSelected
          ? "border-provenance-500 bg-provenance-500/5"
          : "border-border hover:border-violet-300"
      }`}
      data-testid={`choice-${choice.id}`}
    >
      {isSelected && (
        <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-provenance-500 text-white">
          <Check className="h-3 w-3" />
        </div>
      )}

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

      <div className="text-foreground">
        {choice.isOriginal || changeRatio(selectedText, choice.text) >= DIFF_THRESHOLD ? (
          <span className="whitespace-pre-wrap">{choice.text}</span>
        ) : (
          <TrackChangesDiff original={selectedText} suggestion={choice.text} />
        )}
      </div>
    </button>
  );
}

export function InlineAIChooserStage({
  anchorTop,
  anchorRight,
  selectedText,
  activeAction,
  choices,
  selectedChoiceId,
  isLoading,
  error,
  lastPrompt,
  onRetry,
  onSelectChoice,
  onConfirm,
  onDismiss,
}: InlineAIChooserStageProps) {
  const sentenceCount = selectedText.split(/[.!?]+/).filter((s) => s.trim()).length;

  return (
    <div
      className="floating-toolbar absolute z-50 flex w-[calc(100%-2rem)] max-w-lg flex-col overflow-hidden rounded-xl border bg-background shadow-lg"
      style={{
        top: `${anchorTop + 36}px`,
        right: `${anchorRight}px`,
        maxHeight: `calc(100% - ${anchorTop + 36}px - 8px)`,
      }}
      data-testid="inline-ai-chooser"
    >
      <div className="flex shrink-0 items-center justify-between border-b bg-muted px-4 py-2">
        <div className="flex items-center gap-2 text-sm">
          <Sparkles className="h-3.5 w-3.5 text-violet-500" />
          <span className="font-medium">{activeAction}</span>
          <span className="text-muted-foreground">
            · Selection · {sentenceCount} sentence{sentenceCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="min-h-0 space-y-2 overflow-y-auto p-3">
        {isLoading && choices.length === 0 && (
          <div className="py-4 text-center text-sm text-muted-foreground">
            Generating suggestion...
          </div>
        )}

        {error && !isLoading && (
          <div className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
            <p>{error}</p>
            <button
              onClick={() => lastPrompt && onRetry()}
              className="mt-1 font-medium underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {choices.map((choice) => (
          <ChoiceCard
            key={choice.id}
            choice={choice}
            selectedText={selectedText}
            isSelected={selectedChoiceId === choice.id}
            onSelect={() => onSelectChoice(choice.id)}
          />
        ))}
      </div>

      <div className="flex shrink-0 items-center justify-between border-t bg-muted px-4 py-2">
        <span className="text-xs text-muted-foreground">
          <kbd className="rounded border px-1">↑↓</kbd> navigate ·{" "}
          <kbd className="rounded border px-1">Enter</kbd> confirm ·{" "}
          <kbd className="rounded border px-1">Esc</kbd> dismiss
        </span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Cancel
          </Button>
          <Button
            variant="provenance"
            size="sm"
            onClick={onConfirm}
            disabled={isLoading || choices.length === 0}
          >
            Confirm Selection
          </Button>
        </div>
      </div>
    </div>
  );
}
