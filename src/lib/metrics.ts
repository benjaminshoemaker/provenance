interface TipTapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

interface TipTapNode {
  type?: string;
  text?: string;
  content?: TipTapNode[];
  marks?: TipTapMark[];
}

type OriginType = "human" | "ai" | "external_paste";

type MetricCategory =
  | "humanTyped"
  | "aiGenerated"
  | "aiTweaked"
  | "pastedExternal";

export interface BadgeMetrics {
  humanTyped: number;
  aiGenerated: number;
  aiTweaked: number;
  pastedExternal: number;
  totalWords: number;
  humanTypedPercentage: number;
  aiGeneratedPercentage: number;
  aiTweakedPercentage: number;
  pastedExternalPercentage: number;
  typedPercentage: number;
}

const WORD_MATCHER = /[\p{L}\p{N}]+/gu;
const WORD_SEGMENTER =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "word" })
    : null;

function walkTextNodes(
  node: TipTapNode,
  callback: (text: string, marks?: TipTapMark[]) => void
) {
  if (node.text != null) {
    callback(node.text, node.marks);
    return;
  }

  if (node.content) {
    for (const child of node.content) {
      walkTextNodes(child, callback);
    }
  }
}

function countWordTokens(text: string): number {
  if (!text) return 0;

  if (WORD_SEGMENTER) {
    let count = 0;
    for (const segment of WORD_SEGMENTER.segment(text)) {
      if (segment.isWordLike) count++;
    }
    return count;
  }

  WORD_MATCHER.lastIndex = 0;
  return Array.from(text.matchAll(WORD_MATCHER)).length;
}

function getOriginType(mark?: TipTapMark): OriginType {
  const rawType = mark?.attrs?.type;
  if (rawType === "human" || rawType === "ai" || rawType === "external_paste") {
    return rawType;
  }
  return "human";
}

function getTouchedByAI(mark?: TipTapMark): boolean {
  return Boolean(mark?.attrs?.touchedByAI);
}

function resolveCategory(mark?: TipTapMark): MetricCategory {
  const originType = getOriginType(mark);

  if (originType === "external_paste") return "pastedExternal";
  if (originType === "ai") return "aiGenerated";

  return getTouchedByAI(mark) ? "aiTweaked" : "humanTyped";
}

function asPercentage(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

export function calculateMetrics(doc: TipTapNode): BadgeMetrics {
  const counts: Record<MetricCategory, number> = {
    humanTyped: 0,
    aiGenerated: 0,
    aiTweaked: 0,
    pastedExternal: 0,
  };

  walkTextNodes(doc, (text, marks) => {
    const wordCount = countWordTokens(text);
    if (wordCount === 0) return;

    const originMark = marks?.find((mark) => mark.type === "origin");
    const category = resolveCategory(originMark);
    counts[category] += wordCount;
  });

  const totalWords =
    counts.humanTyped +
    counts.aiGenerated +
    counts.aiTweaked +
    counts.pastedExternal;

  const humanTypedPercentage = asPercentage(counts.humanTyped, totalWords);
  const aiGeneratedPercentage = asPercentage(counts.aiGenerated, totalWords);
  const aiTweakedPercentage = asPercentage(counts.aiTweaked, totalWords);
  const pastedExternalPercentage = asPercentage(counts.pastedExternal, totalWords);

  return {
    humanTyped: counts.humanTyped,
    aiGenerated: counts.aiGenerated,
    aiTweaked: counts.aiTweaked,
    pastedExternal: counts.pastedExternal,
    totalWords,
    humanTypedPercentage,
    aiGeneratedPercentage,
    aiTweakedPercentage,
    pastedExternalPercentage,
    typedPercentage: humanTypedPercentage,
  };
}
