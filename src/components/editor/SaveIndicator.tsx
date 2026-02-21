"use client";

interface SaveIndicatorProps {
  status: "idle" | "saving" | "saved" | "error";
}

export function SaveIndicator({ status }: SaveIndicatorProps) {
  if (status === "idle") return null;

  const labels = {
    saving: "Saving...",
    saved: "Saved",
    error: "Error saving",
  };

  const colors = {
    saving: "text-muted-foreground",
    saved: "text-muted-foreground",
    error: "text-destructive",
  };

  return (
    <span className={`text-sm ${colors[status]}`}>
      {labels[status]}
    </span>
  );
}
