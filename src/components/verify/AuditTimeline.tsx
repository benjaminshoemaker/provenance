"use client";

import { useState } from "react";
import {
  groupEventsByDay,
  clusterRevisions,
  getEventCounts,
  type DayGroup,
  type TimelineEvent,
  type RevisionCluster,
} from "@/lib/timeline-utils";
import { Play } from "lucide-react";
import { TimelineMinimap } from "./TimelineMinimap";

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

type FilterType = "all" | "ai_interaction" | "paste" | "revision";

function formatTime(ts: string | Date | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function AuditTimeline(props: AuditTimelineProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  // Build raw events
  const rawEvents = [
    ...props.interactions.map((i) => ({
      type: "ai_interaction" as const,
      timestamp: i.createdAt,
      data: i as Record<string, unknown>,
    })),
    ...props.pasteEvents.map((p) => ({
      type: "paste" as const,
      timestamp: p.createdAt,
      data: p as Record<string, unknown>,
    })),
    ...props.sessions.flatMap((s) => {
      const events: Array<{ type: "session_start" | "session_end"; timestamp: string | Date | null; data: Record<string, unknown> }> = [
        { type: "session_start", timestamp: s.startedAt, data: s as Record<string, unknown> },
      ];
      if (s.endedAt) {
        events.push({ type: "session_end", timestamp: s.endedAt, data: s as Record<string, unknown> });
      }
      return events;
    }),
    ...props.revisions.map((r) => ({
      type: "revision" as const,
      timestamp: r.createdAt,
      data: r as Record<string, unknown>,
    })),
  ];

  rawEvents.sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return ta - tb;
  });

  const counts = getEventCounts(rawEvents);
  const days = groupEventsByDay(rawEvents);

  if (rawEvents.length === 0) {
    return (
      <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
        No audit events recorded.
      </div>
    );
  }

  const filterChips: { id: FilterType; label: string; count: number; dotColor: string }[] = [
    { id: "all", label: "All", count: counts.ai_interaction + counts.paste + counts.revision, dotColor: "bg-gray-400" },
    { id: "ai_interaction", label: "AI", count: counts.ai_interaction, dotColor: "bg-violet-400" },
    { id: "paste", label: "Paste", count: counts.paste, dotColor: "bg-orange-400" },
    { id: "revision", label: "Revisions", count: counts.revision, dotColor: "bg-gray-300" },
  ];

  return (
    <div data-testid="audit-timeline">
      {/* Minimap */}
      <div className="mb-4">
        <TimelineMinimap
          interactions={props.interactions}
          pasteEvents={props.pasteEvents}
          sessions={props.sessions}
        />
      </div>

      {/* Filter chips */}
      <div className="mb-4 flex flex-wrap gap-2" data-testid="filter-chips">
        {filterChips.map((chip) => (
          <button
            key={chip.id}
            onClick={() => setActiveFilter(chip.id)}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors duration-150 ${
              activeFilter === chip.id
                ? "bg-gray-200 text-gray-900"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span className={`inline-block h-2 w-2 rounded-full ${chip.dotColor}`} />
            {chip.label}
            <span className="font-mono tabular-nums text-gray-400">({chip.count})</span>
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {days.map((day) => (
          <DaySection
            key={day.date}
            day={day}
            activeFilter={activeFilter}
            expandedKeys={expandedKeys}
            onToggleExpand={(key) =>
              setExpandedKeys((prev) => {
                const next = new Set(prev);
                if (next.has(key)) next.delete(key);
                else next.add(key);
                return next;
              })
            }
          />
        ))}
      </div>

      {/* Badge landmark */}
      <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 text-center" data-testid="badge-landmark">
        <div className="text-sm font-medium text-emerald-700">
          Badge Generated
        </div>
        <div className="text-xs text-emerald-600">
          Audit trail frozen at this point
        </div>
      </div>
    </div>
  );
}

function DaySection({
  day,
  activeFilter,
  expandedKeys,
  onToggleExpand,
}: {
  day: DayGroup;
  activeFilter: FilterType;
  expandedKeys: Set<string>;
  onToggleExpand: (key: string) => void;
}) {
  return (
    <div>
      {/* Day separator */}
      <div className="flex items-center gap-3 py-2">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs font-medium text-gray-500">{day.label}</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {/* Sessions */}
      <div className="space-y-4">
        {day.sessions.map((session, si) => {
          const filteredEvents =
            activeFilter === "all"
              ? session.events
              : session.events.filter((e) => e.type === activeFilter);

          const clustered = clusterRevisions(filteredEvents);

          if (clustered.length === 0) return null;

          return (
            <div key={si} className="pl-4">
              {/* Session header */}
              <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
                <Play className="h-3 w-3 text-emerald-500" />
                <span className="font-medium">
                  {formatTime(session.startTime)}
                  {session.endTime && ` – ${formatTime(session.endTime)}`}
                </span>
              </div>

              {/* Timeline rail */}
              <div className="relative border-l-2 border-gray-200 pl-6 space-y-2">
                {clustered.map((item, ei) => {
                  const key = `${day.date}-${si}-${ei}`;

                  if ("count" in item) {
                    return (
                      <RevisionClusterRow
                        key={key}
                        cluster={item as RevisionCluster}
                      />
                    );
                  }

                  const event = item as TimelineEvent;
                  return (
                    <EventRow
                      key={key}
                      event={event}
                      eventKey={key}
                      isExpanded={expandedKeys.has(key)}
                      onToggle={() => onToggleExpand(key)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventRow({
  event,
  eventKey,
  isExpanded,
  onToggle,
}: {
  event: TimelineEvent;
  eventKey: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  if (event.type === "ai_interaction") {
    return (
      <div className="relative">
        {/* Dot */}
        <div className="absolute -left-[31px] top-3 h-2.5 w-2.5 rounded-full bg-violet-400" />
        {/* Card */}
        <div className="rounded-lg border border-violet-200/50 bg-violet-50/30 p-3">
          <button
            onClick={onToggle}
            className="flex w-full items-center justify-between text-left text-sm transition-colors duration-150"
          >
            <div className="flex items-center gap-2">
              <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[11px] font-medium text-violet-700">
                {String(event.data.mode)}
              </span>
              <span className="truncate text-gray-700">
                {String(event.data.prompt).slice(0, 60)}
                {String(event.data.prompt).length > 60 ? "..." : ""}
              </span>
            </div>
            <span className="ml-2 shrink-0 text-xs text-gray-500">
              {formatTime(event.timestamp)}
            </span>
          </button>

          {isExpanded && (
            <div className="mt-2 border-t pt-2 text-sm">
              <div className="mb-1">
                <span className="font-medium">Action:</span>{" "}
                <span className={
                  String(event.data.action) === "accepted"
                    ? "text-emerald-700"
                    : String(event.data.action) === "rejected"
                      ? "text-red-600"
                      : "text-amber-600"
                }>
                  {String(event.data.action)}
                </span>
              </div>
              <div className="mb-1">
                <span className="font-medium">Prompt:</span>{" "}
                <span className="break-words text-muted-foreground">
                  {String(event.data.prompt)}
                </span>
              </div>
              <div>
                <span className="font-medium">Response:</span>{" "}
                <span className="break-words text-muted-foreground">
                  {String(event.data.response)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (event.type === "paste") {
    return (
      <div className="relative flex items-center gap-3 py-1">
        {/* Dot */}
        <div className="absolute -left-[31px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-orange-400" />
        <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[11px] font-medium text-orange-700">
          paste
        </span>
        <span className="text-sm text-gray-600">
          {String(event.data.sourceType)} — {String(event.data.characterCount)} chars
        </span>
        <span className="ml-auto text-xs text-gray-500">
          {formatTime(event.timestamp)}
        </span>
      </div>
    );
  }

  // Revision (individual)
  return (
    <div className="relative flex items-center gap-3 py-0.5">
      <div className="absolute -left-[31px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-gray-300" />
      <span className="text-xs text-gray-500">
        Revision saved — {String(event.data.trigger)}
      </span>
      <span className="ml-auto text-xs text-gray-500">
        {formatTime(event.timestamp)}
      </span>
    </div>
  );
}

function RevisionClusterRow({ cluster }: { cluster: RevisionCluster }) {
  return (
    <div className="relative flex items-center gap-3 py-0.5">
      <div className="absolute -left-[31px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-gray-300" />
      <span className="text-xs text-gray-500">
        {cluster.count} revisions over {cluster.durationMinutes}min
      </span>
    </div>
  );
}
