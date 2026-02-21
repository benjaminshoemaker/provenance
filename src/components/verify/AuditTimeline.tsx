"use client";

import { useState } from "react";

interface TimelineEntry {
  type: "ai_interaction" | "paste" | "session_start" | "session_end" | "revision";
  timestamp: string | Date | null;
  data: Record<string, unknown>;
}

interface AuditTimelineProps {
  interactions: Array<{
    mode: string;
    prompt: string;
    response: string;
    action: string;
    createdAt: string | Date | null;
  }>;
  pasteEvents: Array<{
    sourceType: string;
    characterCount: number;
    createdAt: string | Date | null;
  }>;
  sessions: Array<{
    startedAt: string | Date | null;
    endedAt: string | Date | null;
    activeSeconds: number | null;
  }>;
  revisions: Array<{
    trigger: string;
    createdAt: string | Date | null;
  }>;
}

function buildTimeline(props: AuditTimelineProps): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  for (const interaction of props.interactions) {
    entries.push({
      type: "ai_interaction",
      timestamp: interaction.createdAt,
      data: interaction,
    });
  }

  for (const paste of props.pasteEvents) {
    entries.push({
      type: "paste",
      timestamp: paste.createdAt,
      data: paste,
    });
  }

  for (const session of props.sessions) {
    entries.push({
      type: "session_start",
      timestamp: session.startedAt,
      data: session,
    });
    if (session.endedAt) {
      entries.push({
        type: "session_end",
        timestamp: session.endedAt,
        data: session,
      });
    }
  }

  for (const revision of props.revisions) {
    entries.push({
      type: "revision",
      timestamp: revision.createdAt,
      data: revision,
    });
  }

  entries.sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return ta - tb;
  });

  return entries;
}

function formatTimestamp(ts: string | Date | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleString();
}

const typeIcons: Record<string, string> = {
  ai_interaction: "🤖",
  paste: "📋",
  session_start: "▶️",
  session_end: "⏹️",
  revision: "💾",
};

const typeLabels: Record<string, string> = {
  ai_interaction: "AI Interaction",
  paste: "Paste Event",
  session_start: "Session Started",
  session_end: "Session Ended",
  revision: "Revision Saved",
};

export function AuditTimeline(props: AuditTimelineProps) {
  const timeline = buildTimeline(props);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (timeline.length === 0) {
    return (
      <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
        No audit events recorded.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {timeline.map((entry, i) => (
        <div key={i} className="rounded-lg border">
          <button
            className="flex w-full items-center gap-2 p-3 text-left text-sm hover:bg-muted/50 sm:gap-3"
            onClick={() =>
              setExpandedIndex(expandedIndex === i ? null : i)
            }
          >
            <span className="shrink-0">{typeIcons[entry.type]}</span>
            <span className="min-w-0 truncate font-medium sm:truncate-none">{typeLabels[entry.type]}</span>
            <span className="ml-auto shrink-0 text-xs text-muted-foreground">
              {formatTimestamp(entry.timestamp)}
            </span>
          </button>

          {expandedIndex === i && entry.type === "ai_interaction" && (
            <div className="border-t p-3 text-sm">
              <div className="mb-2">
                <span className="font-medium">Mode:</span>{" "}
                {String(entry.data.mode)} — {String(entry.data.action)}
              </div>
              <div className="mb-2">
                <span className="font-medium">Prompt:</span>{" "}
                <span className="break-words text-muted-foreground">
                  {String(entry.data.prompt)}
                </span>
              </div>
              <div>
                <span className="font-medium">Response:</span>{" "}
                <span className="break-words text-muted-foreground">
                  {String(entry.data.response)}
                </span>
              </div>
            </div>
          )}

          {expandedIndex === i && entry.type === "paste" && (
            <div className="border-t p-3 text-sm">
              <span className="font-medium">Source:</span>{" "}
              {String(entry.data.sourceType)} —{" "}
              {String(entry.data.characterCount)} characters
            </div>
          )}

          {expandedIndex === i && entry.type === "session_start" && (
            <div className="border-t p-3 text-sm">
              <span className="font-medium">Active time:</span>{" "}
              {String(entry.data.activeSeconds ?? 0)}s
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
