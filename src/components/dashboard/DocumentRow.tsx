"use client";

import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";

interface DocumentRowProps {
  id: string;
  title: string;
  updatedAt: string | Date | null;
  wordCount: number | null;
  preview?: string;
  aiPercentage?: number | null;
  hasBadge: boolean;
  isArchived?: boolean;
  onClick?: () => void;
  onDelete?: (id: string) => void;
}

function getAIBadgeColor(percentage: number): string {
  if (percentage <= 25) return "bg-emerald-50 text-emerald-700";
  if (percentage <= 50) return "bg-amber-50 text-amber-700";
  if (percentage <= 75) return "bg-orange-50 text-orange-700";
  return "bg-red-50 text-red-700";
}

function relativeDate(date: string | Date | null): string {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

export function DocumentRow({
  id,
  title,
  updatedAt,
  wordCount,
  preview,
  aiPercentage,
  hasBadge,
  isArchived,
  onClick,
  onDelete,
}: DocumentRowProps) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick?.(); }}
      className={cn(
        "flex w-full items-start gap-3 border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50 cursor-pointer transition-colors duration-150",
        isArchived && "opacity-60"
      )}
    >
      {/* Status dot */}
      <span
        className={cn(
          "mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full",
          hasBadge ? "bg-emerald-500" : isArchived ? "bg-gray-200" : "bg-gray-300"
        )}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium">{title || "Untitled"}</span>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-xs text-gray-500">
              {relativeDate(updatedAt)}
            </span>
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(id);
                }}
                className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors duration-150"
                aria-label={`Delete ${title || "Untitled"}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {preview && (
          <p className="mt-0.5 truncate text-xs text-gray-500">{preview}</p>
        )}

        <div className="mt-1 flex items-center gap-2">
          {aiPercentage != null && (
            <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium font-mono tabular-nums ${getAIBadgeColor(aiPercentage)}`}>
              {aiPercentage}% AI
            </span>
          )}
          {wordCount != null && (
            <span className="text-[11px] text-gray-500 font-mono tabular-nums">
              {wordCount.toLocaleString()} words
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
