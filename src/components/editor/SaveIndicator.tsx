"use client";

interface SaveIndicatorProps {
  status: "idle" | "saving" | "saved" | "error";
  onRetry?: () => void;
}

export function SaveIndicator({ status, onRetry }: SaveIndicatorProps) {
  if (status === "idle") return null;

  const labels = {
    saving: "Saving...",
    saved: "Saved",
    error: "Save failed",
  };

  const colors = {
    saving: "text-muted-foreground",
    saved: "text-muted-foreground",
    error: "text-destructive",
  };

  return (
    <span className={`text-sm ${colors[status]}`} data-testid="save-indicator">
      {labels[status]}
      {status === "error" && onRetry && (
        <button
          onClick={onRetry}
          className="ml-1 font-medium underline hover:no-underline"
        >
          retry
        </button>
      )}
    </span>
  );
}
