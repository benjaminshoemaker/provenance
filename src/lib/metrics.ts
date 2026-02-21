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
      // Check modification threshold
      const originalLength = originMark.attrs?.originalLength as
        | number
        | null;
      if (
        originalLength != null &&
        Math.abs(length - originalLength) / originalLength > 0.2
      ) {
        // Modified by >20% — reclassify as human
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
