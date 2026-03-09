import { describe, it, expect } from "vitest";
import { calculateMetrics } from "./metrics";

describe("calculateMetrics", () => {
  it("should bucket words into all four categories", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "human typed" }, // 2 words
            {
              type: "text",
              text: " ai generated",
              marks: [
                {
                  type: "origin",
                  attrs: { type: "ai", touchedByAI: true, sourceId: "ai-1" },
                },
              ],
            }, // 2 words
            {
              type: "text",
              text: " tweaked words",
              marks: [
                {
                  type: "origin",
                  attrs: { type: "human", touchedByAI: true },
                },
              ],
            }, // 2 words
            {
              type: "text",
              text: " pasted outside",
              marks: [
                {
                  type: "origin",
                  attrs: { type: "external_paste", sourceId: "paste-1" },
                },
              ],
            }, // 2 words
          ],
        },
      ],
    };

    const metrics = calculateMetrics(doc);
    expect(metrics.humanTyped).toBe(2);
    expect(metrics.aiGenerated).toBe(2);
    expect(metrics.aiTweaked).toBe(2);
    expect(metrics.pastedExternal).toBe(2);
    expect(metrics.totalWords).toBe(8);
    expect(metrics.humanTypedPercentage).toBe(25);
    expect(metrics.aiGeneratedPercentage).toBe(25);
    expect(metrics.aiTweakedPercentage).toBe(25);
    expect(metrics.pastedExternalPercentage).toBe(25);
    expect(metrics.typedPercentage).toBe(25);
  });

  it("should treat ai origin as AI generated even when touchedByAI is missing", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "alpha beta",
              marks: [
                {
                  type: "origin",
                  attrs: { type: "ai", sourceId: "ai-legacy" },
                },
              ],
            },
          ],
        },
      ],
    };

    const metrics = calculateMetrics(doc);
    expect(metrics.aiGenerated).toBe(2);
    expect(metrics.humanTyped).toBe(0);
  });

  it("should treat human origin with touchedByAI true as AI tweaked", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "author words",
              marks: [
                {
                  type: "origin",
                  attrs: { type: "human", touchedByAI: true },
                },
              ],
            },
          ],
        },
      ],
    };

    const metrics = calculateMetrics(doc);
    expect(metrics.aiTweaked).toBe(2);
    expect(metrics.humanTyped).toBe(0);
  });

  it("should treat unmarked text and human origin with missing touchedByAI as human typed", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "plain text" }, // 2
            {
              type: "text",
              text: " more words",
              marks: [
                {
                  type: "origin",
                  attrs: { type: "human" },
                },
              ],
            }, // 2
          ],
        },
      ],
    };

    const metrics = calculateMetrics(doc);
    expect(metrics.humanTyped).toBe(4);
    expect(metrics.aiTweaked).toBe(0);
  });

  it("should return 0 metrics for empty documents", () => {
    const doc = {
      type: "doc",
      content: [{ type: "paragraph" }],
    };

    const metrics = calculateMetrics(doc);
    expect(metrics.totalWords).toBe(0);
    expect(metrics.humanTypedPercentage).toBe(0);
    expect(metrics.aiGeneratedPercentage).toBe(0);
    expect(metrics.aiTweakedPercentage).toBe(0);
    expect(metrics.pastedExternalPercentage).toBe(0);
  });

  it("should count unicode words consistently", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "こんにちは 世界" }, // 2 words
            {
              type: "text",
              text: " Привет",
              marks: [
                {
                  type: "origin",
                  attrs: { type: "ai", touchedByAI: true },
                },
              ],
            }, // 1 word
          ],
        },
      ],
    };

    const metrics = calculateMetrics(doc);
    expect(metrics.humanTyped).toBe(2);
    expect(metrics.aiGenerated).toBe(1);
    expect(metrics.totalWords).toBe(3);
  });
});
