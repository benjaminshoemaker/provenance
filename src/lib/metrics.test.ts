import { describe, it, expect } from "vitest";
import { calculateMetrics } from "./metrics";

describe("calculateMetrics", () => {
  it("should correctly count AI, human, and external paste characters", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "human text" }, // 10 chars
            {
              type: "text",
              text: "ai text",
              marks: [
                {
                  type: "origin",
                  attrs: {
                    type: "ai",
                    sourceId: "s1",
                    originalLength: 7,
                  },
                },
              ],
            }, // 7 chars
            {
              type: "text",
              text: "pasted",
              marks: [
                {
                  type: "origin",
                  attrs: {
                    type: "external_paste",
                    sourceId: "p1",
                    originalLength: 6,
                  },
                },
              ],
            }, // 6 chars
          ],
        },
      ],
    };

    const metrics = calculateMetrics(doc);
    expect(metrics.total_characters).toBe(23);
    expect(metrics.ai_percentage).toBe(Math.round((7 / 23) * 100));
    expect(metrics.external_paste_percentage).toBe(
      Math.round((6 / 23) * 100)
    );
  });

  it("should count unmarked text as human (conservative default)", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "all human text here" }, // no marks
          ],
        },
      ],
    };

    const metrics = calculateMetrics(doc);
    expect(metrics.total_characters).toBe(19);
    expect(metrics.ai_percentage).toBe(0);
    expect(metrics.external_paste_percentage).toBe(0);
  });

  it("should reclassify AI span modified >20% as human", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "this is much longer now after editing",
              marks: [
                {
                  type: "origin",
                  attrs: {
                    type: "ai",
                    sourceId: "s1",
                    originalLength: 10, // was 10 chars, now 37 — >20% change
                  },
                },
              ],
            },
          ],
        },
      ],
    };

    const metrics = calculateMetrics(doc);
    // Modified by >20%, so reclassified as human
    expect(metrics.ai_percentage).toBe(0);
    expect(metrics.total_characters).toBe(37);
  });

  it("should return 0% for all metrics on empty document", () => {
    const doc = {
      type: "doc",
      content: [{ type: "paragraph" }],
    };

    const metrics = calculateMetrics(doc);
    expect(metrics.ai_percentage).toBe(0);
    expect(metrics.external_paste_percentage).toBe(0);
    expect(metrics.total_characters).toBe(0);
  });

  it("should report external paste characters as separate metric", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "pasted from clipboard",
              marks: [
                {
                  type: "origin",
                  attrs: {
                    type: "external_paste",
                    sourceId: "p1",
                    originalLength: 21,
                  },
                },
              ],
            },
          ],
        },
      ],
    };

    const metrics = calculateMetrics(doc);
    expect(metrics.external_paste_percentage).toBe(100);
    expect(metrics.ai_percentage).toBe(0);
    expect(metrics.total_characters).toBe(21);
  });

  it("should keep AI classification when modification is within 20%", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "hello world!", // 12 chars
              marks: [
                {
                  type: "origin",
                  attrs: {
                    type: "ai",
                    sourceId: "s1",
                    originalLength: 11, // was 11, now 12 — ~9% change, within 20%
                  },
                },
              ],
            },
          ],
        },
      ],
    };

    const metrics = calculateMetrics(doc);
    expect(metrics.ai_percentage).toBe(100);
  });
});
