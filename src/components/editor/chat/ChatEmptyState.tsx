"use client";

import { Sparkles } from "lucide-react";

const suggestions = [
  { icon: "🔍", text: "Where does my argument fall apart?" },
  { icon: "📐", text: "How could I restructure this?" },
  { icon: "📚", text: "Find supporting research" },
  { icon: "🎯", text: "Is my core message clear?" },
];

interface ChatEmptyStateProps {
  onSuggestionClick: (suggestion: string) => void;
}

export function ChatEmptyState({ onSuggestionClick }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-8 text-center">
      {/* Icon */}
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-violet-100 bg-violet-50 text-violet-500">
        <Sparkles className="h-5 w-5" />
      </div>

      {/* Heading */}
      <h3 className="text-sm font-semibold text-gray-800">
        Ask about your writing
      </h3>

      {/* Description */}
      <p className="max-w-[280px] text-[13px] leading-snug text-gray-400">
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
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left transition-all hover:border-gray-300 hover:bg-gray-50"
          >
            <span className="w-5 shrink-0 text-center text-sm text-gray-400">
              {s.icon}
            </span>
            <span className="text-[13px] font-medium text-gray-600">
              {s.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
