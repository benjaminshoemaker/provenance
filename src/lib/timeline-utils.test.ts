import { describe, it, expect } from "vitest";
import { groupEventsByDay, clusterRevisions, getEventCounts } from "./timeline-utils";

describe("timeline-utils", () => {
  describe("groupEventsByDay", () => {
    it("should group events by date", () => {
      const events = [
        { type: "ai_interaction" as const, timestamp: "2025-01-15T10:00:00Z", data: {} },
        { type: "paste" as const, timestamp: "2025-01-15T11:00:00Z", data: {} },
        { type: "revision" as const, timestamp: "2025-01-16T09:00:00Z", data: {} },
      ];

      const days = groupEventsByDay(events);
      expect(days).toHaveLength(2);
      expect(days[0].date).toBe("2025-01-15");
      expect(days[1].date).toBe("2025-01-16");
    });

    it("should handle empty events array", () => {
      const days = groupEventsByDay([]);
      expect(days).toHaveLength(0);
    });

    it("should group events into sessions within a day", () => {
      const events = [
        { type: "session_start" as const, timestamp: "2025-01-15T10:00:00Z", data: {} },
        { type: "ai_interaction" as const, timestamp: "2025-01-15T10:05:00Z", data: {} },
        { type: "session_end" as const, timestamp: "2025-01-15T10:30:00Z", data: {} },
      ];

      const days = groupEventsByDay(events);
      expect(days).toHaveLength(1);
      expect(days[0].sessions).toHaveLength(1);
      expect(days[0].sessions[0].events).toHaveLength(1);
      expect(days[0].sessions[0].events[0].type).toBe("ai_interaction");
    });
  });

  describe("clusterRevisions", () => {
    it("should cluster 3+ consecutive revisions into a single entry", () => {
      const events = [
        { type: "revision" as const, timestamp: "2025-01-15T10:00:00Z", data: {} },
        { type: "revision" as const, timestamp: "2025-01-15T10:05:00Z", data: {} },
        { type: "revision" as const, timestamp: "2025-01-15T10:10:00Z", data: {} },
        { type: "revision" as const, timestamp: "2025-01-15T10:15:00Z", data: {} },
      ];

      const result = clusterRevisions(events);
      expect(result).toHaveLength(1);
      expect("count" in result[0]).toBe(true);
      if ("count" in result[0]) {
        expect(result[0].count).toBe(4);
        expect(result[0].durationMinutes).toBe(15);
      }
    });

    it("should keep 1-2 revisions as individual events", () => {
      const events = [
        { type: "revision" as const, timestamp: "2025-01-15T10:00:00Z", data: {} },
        { type: "revision" as const, timestamp: "2025-01-15T10:05:00Z", data: {} },
      ];

      const result = clusterRevisions(events);
      expect(result).toHaveLength(2);
    });

    it("should keep non-revision events as-is", () => {
      const events = [
        { type: "ai_interaction" as const, timestamp: "2025-01-15T10:00:00Z", data: {} },
        { type: "paste" as const, timestamp: "2025-01-15T10:05:00Z", data: {} },
      ];

      const result = clusterRevisions(events);
      expect(result).toHaveLength(2);
    });
  });

  describe("getEventCounts", () => {
    it("should count events by type", () => {
      const events = [
        { type: "ai_interaction" as const, timestamp: "2025-01-15T10:00:00Z", data: {} },
        { type: "ai_interaction" as const, timestamp: "2025-01-15T10:05:00Z", data: {} },
        { type: "paste" as const, timestamp: "2025-01-15T11:00:00Z", data: {} },
        { type: "revision" as const, timestamp: "2025-01-15T11:05:00Z", data: {} },
      ];

      const counts = getEventCounts(events);
      expect(counts.ai_interaction).toBe(2);
      expect(counts.paste).toBe(1);
      expect(counts.revision).toBe(1);
    });
  });
});
