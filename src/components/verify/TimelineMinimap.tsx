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

export function TimelineMinimap({ interactions, pasteEvents, sessions }: TimelineMinimapProps) {
  // Build events with timestamps
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

  if (events.length === 0) return null;

  events.sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return ta - tb;
  });

  const minTime = new Date(events[0].timestamp!).getTime();
  const maxTime = new Date(events[events.length - 1].timestamp!).getTime();
  const range = maxTime - minTime || 1;

  // Build segments: each event gets a proportional segment
  const segments = events.map((e) => {
    const time = new Date(e.timestamp!).getTime();
    const position = ((time - minTime) / range) * 100;
    return { type: e.type, position };
  });

  // Convert to percentage-width segments
  const bars: { type: MinimapEvent["type"]; width: number }[] = [];
  for (let i = 0; i < segments.length; i++) {
    const start = segments[i].position;
    const end = i < segments.length - 1 ? segments[i + 1].position : 100;
    bars.push({ type: segments[i].type, width: Math.max(end - start, 1) });
  }

  // Date labels
  const startDate = new Date(events[0].timestamp!).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endDate = new Date(events[events.length - 1].timestamp!).toLocaleDateString("en-US", { month: "short", day: "numeric" });

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
      <div className="mt-1 flex justify-between text-[11px] text-gray-500">
        <span>{startDate}</span>
        <span>{endDate}</span>
      </div>

      {/* Legend */}
      <div className="mt-2 flex gap-4 text-xs text-gray-500">
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
