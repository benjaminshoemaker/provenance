interface RawEvent {
  type: "ai_interaction" | "paste" | "session_start" | "session_end" | "revision";
  timestamp: string | Date | null;
  data: Record<string, unknown>;
}

export interface DayGroup {
  date: string; // YYYY-MM-DD
  label: string; // "Jan 15, 2025"
  sessions: SessionGroup[];
}

export interface SessionGroup {
  startTime: string | null;
  endTime: string | null;
  events: TimelineEvent[];
}

export interface TimelineEvent {
  type: "ai_interaction" | "paste" | "revision";
  timestamp: string | Date | null;
  data: Record<string, unknown>;
}

export interface RevisionCluster {
  count: number;
  startTime: string | Date | null;
  endTime: string | Date | null;
  durationMinutes: number;
}

function toDateKey(ts: string | Date | null): string {
  if (!ts) return "unknown";
  const d = new Date(ts);
  return d.toISOString().split("T")[0];
}

function formatDateLabel(dateKey: string): string {
  if (dateKey === "unknown") return "Unknown Date";
  const d = new Date(dateKey + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function groupEventsByDay(events: RawEvent[]): DayGroup[] {
  const dayMap = new Map<string, RawEvent[]>();

  for (const event of events) {
    const key = toDateKey(event.timestamp);
    if (!dayMap.has(key)) dayMap.set(key, []);
    dayMap.get(key)!.push(event);
  }

  const days: DayGroup[] = [];
  const sortedKeys = [...dayMap.keys()].sort();

  for (const key of sortedKeys) {
    const dayEvents = dayMap.get(key)!;
    days.push({
      date: key,
      label: formatDateLabel(key),
      sessions: groupIntoSessions(dayEvents),
    });
  }

  return days;
}

function groupIntoSessions(events: RawEvent[]): SessionGroup[] {
  // Find session boundaries
  const sessionStarts = events.filter((e) => e.type === "session_start");
  const nonSessionEvents = events.filter(
    (e) => e.type !== "session_start" && e.type !== "session_end"
  );

  if (sessionStarts.length === 0) {
    // No sessions, put all events in a single group
    return [{
      startTime: nonSessionEvents[0]?.timestamp?.toString() ?? null,
      endTime: nonSessionEvents[nonSessionEvents.length - 1]?.timestamp?.toString() ?? null,
      events: nonSessionEvents.map((e) => ({
        type: e.type as TimelineEvent["type"],
        timestamp: e.timestamp,
        data: e.data,
      })),
    }];
  }

  // Group events by session
  const sessions: SessionGroup[] = [];
  const sorted = [...events].sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return ta - tb;
  });

  let currentSession: SessionGroup | null = null;

  for (const event of sorted) {
    if (event.type === "session_start") {
      if (currentSession) sessions.push(currentSession);
      currentSession = {
        startTime: event.timestamp?.toString() ?? null,
        endTime: null,
        events: [],
      };
    } else if (event.type === "session_end") {
      if (currentSession) {
        currentSession.endTime = event.timestamp?.toString() ?? null;
        sessions.push(currentSession);
        currentSession = null;
      }
    } else {
      if (!currentSession) {
        currentSession = {
          startTime: event.timestamp?.toString() ?? null,
          endTime: null,
          events: [],
        };
      }
      currentSession.events.push({
        type: event.type as TimelineEvent["type"],
        timestamp: event.timestamp,
        data: event.data,
      });
    }
  }

  if (currentSession) sessions.push(currentSession);

  return sessions;
}

export function clusterRevisions(events: TimelineEvent[]): (TimelineEvent | RevisionCluster)[] {
  const result: (TimelineEvent | RevisionCluster)[] = [];
  let revisionBuffer: TimelineEvent[] = [];

  const flushRevisions = () => {
    if (revisionBuffer.length === 0) return;
    if (revisionBuffer.length <= 2) {
      result.push(...revisionBuffer);
    } else {
      const first = revisionBuffer[0].timestamp;
      const last = revisionBuffer[revisionBuffer.length - 1].timestamp;
      const startMs = first ? new Date(first).getTime() : 0;
      const endMs = last ? new Date(last).getTime() : 0;
      result.push({
        count: revisionBuffer.length,
        startTime: first,
        endTime: last,
        durationMinutes: Math.round((endMs - startMs) / 60000),
      });
    }
    revisionBuffer = [];
  };

  for (const event of events) {
    if (event.type === "revision") {
      revisionBuffer.push(event);
    } else {
      flushRevisions();
      result.push(event);
    }
  }
  flushRevisions();

  return result;
}

export function getEventCounts(events: RawEvent[]): Record<string, number> {
  const counts: Record<string, number> = {
    ai_interaction: 0,
    paste: 0,
    revision: 0,
  };

  for (const event of events) {
    if (event.type in counts) {
      counts[event.type]++;
    }
  }

  return counts;
}
