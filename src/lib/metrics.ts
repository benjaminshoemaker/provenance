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

function walkTextNodes(
  node: TipTapNode,
  callback: (text: string, marks?: TipTapMark[]) => void
) {
  if (node.text) {
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
 * Used to detect whether AI-generated text has been substantially modified.
 */
export function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  // Optimize for common cases
  if (m === 0) return n;
  if (n === 0) return m;
  if (a === b) return 0;

  // Use single-row optimization (O(min(m,n)) space)
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array<number>(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }

  return prev[n];
}

export function calculateMetrics(doc: TipTapNode): BadgeStats {
  let aiChars = 0;
  let humanChars = 0;
  let externalPasteChars = 0;

  walkTextNodes(doc, (text, marks) => {
    const originMark = marks?.find((m) => m.type === "origin");
    const length = text.length;

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
        const maxLen = Math.max(originalText.length, length);
        if (maxLen > 0 && distance / maxLen > 0.2) {
          // Modified by >20% edit distance — reclassify as human
          humanChars += length;
        } else {
          aiChars += length;
        }
      } else if (
        originalLength != null &&
        Math.abs(length - originalLength) / originalLength > 0.2
      ) {
        // Fallback: length-based check for marks without originalText
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
  return {
    ai_percentage: total > 0 ? Math.round((aiChars / total) * 100) : 0,
    external_paste_percentage:
      total > 0 ? Math.round((externalPasteChars / total) * 100) : 0,
    total_characters: total,
  };
}
