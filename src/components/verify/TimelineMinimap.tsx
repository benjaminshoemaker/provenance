"use client";

interface MinimapEvent {
  type: "writing" | "ai" | "paste";
  timestamp: string | Date | null;
}

interface TimelineMinimapProps {
  interactions: Array<{ createdAt: string | Date | null }>;
  pasteEvents: Array<{ createdAt: string | Date | null }>;
  sessions: Array<{
    startedAt: string | Date | null;
    endedAt: string | Date | null;
  }>;
}

const COLORS = {
  writing: "bg-emerald-500",
  ai: "bg-violet-500",
  paste: "bg-orange-500",
};

function buildTimelineEvents({
  interactions,
  pasteEvents,
  sessions,
}: TimelineMinimapProps): MinimapEvent[] {
  const events: MinimapEvent[] = [];

  for (const session of sessions) {
    if (session.startedAt) {
      events.push({ type: "writing", timestamp: session.startedAt });
    }
  }

  for (const interaction of interactions) {
    if (interaction.createdAt) {
      events.push({ type: "ai", timestamp: interaction.createdAt });
    }
  }

  for (const paste of pasteEvents) {
    if (paste.createdAt) {
      events.push({ type: "paste", timestamp: paste.createdAt });
    }
  }

  return events;
}

function sortEventsByTimestamp(events: MinimapEvent[]) {
  return [...events].sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return ta - tb;
  });
}

function buildBars(events: MinimapEvent[]) {
  const minTime = new Date(events[0].timestamp!).getTime();
  const maxTime = new Date(events[events.length - 1].timestamp!).getTime();
  const range = maxTime - minTime || 1;

  return events.map((event, index) => {
    const start = ((new Date(event.timestamp!).getTime() - minTime) / range) * 100;
    const end =
      index < events.length - 1
        ? ((new Date(events[index + 1].timestamp!).getTime() - minTime) / range) *
          100
        : 100;

    return {
      type: event.type,
      width: Math.max(end - start, 1),
    };
  });
}

function formatDateLabel(timestamp: string | Date | null) {
  return new Date(timestamp!).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function TimelineMinimap({ interactions, pasteEvents, sessions }: TimelineMinimapProps) {
  const events = buildTimelineEvents({ interactions, pasteEvents, sessions });

  if (events.length === 0) return null;

  const sortedEvents = sortEventsByTimestamp(events);
  const bars = buildBars(sortedEvents);
  const startDate = formatDateLabel(sortedEvents[0].timestamp);
  const endDate = formatDateLabel(sortedEvents[sortedEvents.length - 1].timestamp);

  return (
    <div data-testid="timeline-minimap">
      {/* Bar */}
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {bars.map((bar, i) => (
          <div
            key={i}
            className={COLORS[bar.type]}
            style={{ width: `${bar.width}%` }}
          />
        ))}
      </div>

      {/* Date labels */}
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>{startDate}</span>
        <span>{endDate}</span>
      </div>

      {/* Legend */}
      <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          Writing
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-violet-500" />
          AI
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-orange-500" />
          Paste
        </span>
      </div>
    </div>
  );
}
