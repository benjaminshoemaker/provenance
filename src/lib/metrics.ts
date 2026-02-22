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

interface BadgeStats {
  ai_percentage: number;
  external_paste_percentage: number;
  total_characters: number;
}

interface AiInteractionLike {
  action?: string | null;
  response?: string | null;
}

/** Count characters as Unicode code points, not UTF-16 code units. */
function countChars(text: string): number {
  let count = 0;
  for (const _ of text) count++;
  return count;
}

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

/**
 * Compute Levenshtein edit distance between two strings.
 * Operates on Unicode code points (not UTF-16 code units) for correct
 * handling of emoji and other characters outside the Basic Multilingual Plane.
 */
export function editDistance(a: string, b: string): number {
  // Spread to get code points instead of UTF-16 code units
  const aChars = [...a];
  const bChars = [...b];
  const m = aChars.length;
  const n = bChars.length;
  if (m === 0) return n;
  if (n === 0) return m;
  if (a === b) return 0;

  // Two-row DP (O(n) space)
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array<number>(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = aChars[i - 1] === bChars[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }

  return prev[n];
}

const MIN_RESPONSE_MATCH_CHARS = 20;

function findNonOverlappingMatch(
  text: string,
  pattern: string,
  occupied: boolean[]
): number {
  let fromIndex = 0;
  const maxStart = text.length - pattern.length;
  while (fromIndex <= maxStart) {
    const idx = text.indexOf(pattern, fromIndex);
    if (idx === -1) return -1;

    let overlaps = false;
    for (let i = idx; i < idx + pattern.length; i++) {
      if (occupied[i]) {
        overlaps = true;
        break;
      }
    }

    if (!overlaps) return idx;
    fromIndex = idx + 1;
  }

  return -1;
}

/**
 * Fallback estimator for legacy snapshots that have missing/stripped origin attrs.
 * Counts accepted AI responses that are still present verbatim in final text.
 */
export function estimateRetainedAiCharactersFromAcceptedResponses(
  documentText: string,
  interactions: AiInteractionLike[]
): number {
  if (!documentText || interactions.length === 0) return 0;

  const acceptedResponses = interactions
    .filter(
      (interaction) =>
        interaction.action === "accepted" &&
        typeof interaction.response === "string"
    )
    .map((interaction) => interaction.response?.trim() ?? "")
    .filter((response) => countChars(response) >= MIN_RESPONSE_MATCH_CHARS)
    .sort((a, b) => countChars(b) - countChars(a));

  if (acceptedResponses.length === 0) return 0;

  const occupied = new Array(documentText.length).fill(false);
  let retainedChars = 0;

  for (const response of acceptedResponses) {
    const matchStart = findNonOverlappingMatch(documentText, response, occupied);
    if (matchStart === -1) continue;

    for (let i = matchStart; i < matchStart + response.length; i++) {
      occupied[i] = true;
    }
    retainedChars += countChars(response);
  }

  return retainedChars;
}

export function calculateMetrics(doc: TipTapNode): BadgeStats {
  let aiChars = 0;
  let humanChars = 0;
  let externalPasteChars = 0;

  walkTextNodes(doc, (text, marks) => {
    const originMark = marks?.find((m) => m.type === "origin");
    const length = countChars(text);

    if (!originMark || originMark.attrs?.type === "human") {
      humanChars += length;
    } else if (originMark.attrs?.type === "ai") {
      // Check modification threshold using edit distance
      const originalLength = originMark.attrs?.originalLength as
        | number
        | null;
      const originalText = originMark.attrs?.originalText as string | null;

      if (originalText != null) {
        // Use character-level edit distance for accurate comparison
        const distance = editDistance(originalText, text);
        const maxLen = Math.max(countChars(originalText), length);
        if (maxLen > 0 && distance / maxLen > 0.2) {
          // Modified by >20% edit distance — reclassify as human
          humanChars += length;
        } else {
          aiChars += length;
        }
      } else if (
        originalLength != null &&
        originalLength > 0 &&
        Math.abs(length - originalLength) / Math.max(originalLength, length) > 0.2
      ) {
        // Fallback: length-based check for marks without originalText
        // Uses Math.max(originalLength, length) for consistent normalization
        humanChars += length;
      } else {
        aiChars += length;
      }
    } else if (originMark.attrs?.type === "external_paste") {
      externalPasteChars += length;
    } else {
      humanChars += length;
    }
  });

  const total = aiChars + humanChars + externalPasteChars;
  // Use Math.floor to prevent ai% + external% from exceeding 100%
  const aiPct = total > 0 ? Math.floor((aiChars / total) * 100) : 0;
  const externalPct = total > 0 ? Math.floor((externalPasteChars / total) * 100) : 0;
  return {
    ai_percentage: aiPct,
    external_paste_percentage: externalPct,
    total_characters: total,
  };
}
