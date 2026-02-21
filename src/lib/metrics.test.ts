import { describe, it, expect } from "vitest";
import { calculateMetrics, editDistance } from "./metrics";

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
    expect(metrics.ai_percentage).toBe(Math.floor((7 / 23) * 100));
    expect(metrics.external_paste_percentage).toBe(
      Math.floor((6 / 23) * 100)
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

  it("should reclassify AI span as human when originalText edit distance >20%", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "completely different text now",
              marks: [
                {
                  type: "origin",
                  attrs: {
                    type: "ai",
                    sourceId: "s1",
                    originalLength: 20,
                    originalText: "original ai response",
                  },
                },
              ],
            },
          ],
        },
      ],
    };

    const metrics = calculateMetrics(doc);
    // Edit distance between "original ai response" and "completely different text now"
    // is high (>20%), so reclassified as human
    expect(metrics.ai_percentage).toBe(0);
  });

  it("should keep AI classification when originalText edit distance <=20%", () => {
    const original = "Hello world from AI";
    const modified = "Hello world from AI!"; // only 1 char added
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: modified,
              marks: [
                {
                  type: "origin",
                  attrs: {
                    type: "ai",
                    sourceId: "s1",
                    originalLength: original.length,
                    originalText: original,
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

  it("should never have ai_percentage + external_paste_percentage exceed 100", () => {
    // Construct a doc where Math.round would produce 51% + 50% = 101%
    // 101 AI chars + 99 external chars = 200 total
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "a".repeat(101),
              marks: [
                {
                  type: "origin",
                  attrs: { type: "ai", sourceId: "s1", originalLength: 101 },
                },
              ],
            },
            {
              type: "text",
              text: "b".repeat(99),
              marks: [
                {
                  type: "origin",
                  attrs: { type: "external_paste", sourceId: "p1", originalLength: 99 },
                },
              ],
            },
          ],
        },
      ],
    };

    const metrics = calculateMetrics(doc);
    expect(metrics.ai_percentage + metrics.external_paste_percentage).toBeLessThanOrEqual(100);
  });

  it("should handle originalLength of 0 without division by zero", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "some text here",
              marks: [
                {
                  type: "origin",
                  attrs: { type: "ai", sourceId: "s1", originalLength: 0 },
                },
              ],
            },
          ],
        },
      ],
    };

    // Should not throw; originalLength=0 should default to AI classification
    const metrics = calculateMetrics(doc);
    expect(metrics.ai_percentage).toBe(100);
    expect(metrics.total_characters).toBe(14);
  });

  it("should keep AI classification at exactly 20% edit distance boundary", () => {
    // "abcde" (5 chars), change 1 char = distance 1, 1/5 = 0.2 = exactly 20%
    // > 0.2 is false, so it should stay AI
    const original = "abcde";
    const modified = "abcdX"; // 1 substitution
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: modified,
              marks: [
                {
                  type: "origin",
                  attrs: {
                    type: "ai",
                    sourceId: "s1",
                    originalLength: original.length,
                    originalText: original,
                  },
                },
              ],
            },
          ],
        },
      ],
    };

    const metrics = calculateMetrics(doc);
    // Exactly 20% should stay classified as AI (threshold is >20%)
    expect(metrics.ai_percentage).toBe(100);
  });

  it("should count unicode characters correctly (emoji as single char)", () => {
    // Each emoji is 1 visible character but 2 UTF-16 code units
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "\u{1F600}\u{1F601}\u{1F602}" }, // 3 emoji = 3 code points
            {
              type: "text",
              text: "abc",
              marks: [
                {
                  type: "origin",
                  attrs: { type: "ai", sourceId: "s1", originalLength: 3 },
                },
              ],
            },
          ],
        },
      ],
    };

    const metrics = calculateMetrics(doc);
    // 3 emoji (human) + 3 ASCII (ai) = 6 total chars
    expect(metrics.total_characters).toBe(6);
    expect(metrics.ai_percentage).toBe(50);
  });
});

describe("editDistance", () => {
  it("should return 0 for identical strings", () => {
    expect(editDistance("hello", "hello")).toBe(0);
  });

  it("should return length of other string when one is empty", () => {
    expect(editDistance("", "hello")).toBe(5);
    expect(editDistance("hello", "")).toBe(5);
  });

  it("should compute correct distance for single character changes", () => {
    expect(editDistance("cat", "hat")).toBe(1); // substitution
    expect(editDistance("cat", "cats")).toBe(1); // insertion
    expect(editDistance("cats", "cat")).toBe(1); // deletion
  });

  it("should compute correct distance for completely different strings", () => {
    expect(editDistance("abc", "xyz")).toBe(3);
  });

  it("should handle multi-edit transformations", () => {
    // kitten -> sitting = 3 edits
    expect(editDistance("kitten", "sitting")).toBe(3);
  });

  it("should count emoji as single characters", () => {
    // One emoji substitution = distance 1, not 2
    expect(editDistance("\u{1F600}", "\u{1F601}")).toBe(1);
    expect(editDistance("a\u{1F600}b", "a\u{1F601}b")).toBe(1);
  });
});
