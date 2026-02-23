"use client";

import { Sparkles, SearchX, LayoutList, BookOpen, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const suggestions: { icon: LucideIcon; text: string }[] = [
  { icon: SearchX, text: "Where does my argument fall apart?" },
  { icon: LayoutList, text: "How could I restructure this?" },
  { icon: BookOpen, text: "Find supporting research" },
  { icon: Target, text: "Is my core message clear?" },
];

interface ChatEmptyStateProps {
  onSuggestionClick: (suggestion: string) => void;
}

export function ChatEmptyState({ onSuggestionClick }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-start gap-3 px-6 pt-16 text-center">
      {/* Icon */}
      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-100 bg-violet-50 text-violet-500">
        <Sparkles className="h-4 w-4" />
      </div>

      {/* Heading */}
      <h3 className="text-sm font-medium text-muted-foreground">
        Ask about your writing
      </h3>

      {/* Description */}
      <p className="max-w-[280px] text-sm leading-snug text-muted-foreground">
        Get critique, explore ideas, or research topics. Your full document is
        loaded as context.
      </p>

      {/* Suggested prompts — vertical card list */}
      <div className="mt-1 flex w-full max-w-[300px] flex-col gap-1.5">
        {suggestions.map((s) => (
          <button
            key={s.text}
            type="button"
            onClick={() => onSuggestionClick(s.text)}
            className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-left transition-colors hover:border-ring hover:bg-muted"
          >
            <s.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {s.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
