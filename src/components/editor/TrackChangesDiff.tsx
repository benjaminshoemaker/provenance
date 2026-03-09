"use client";

interface TrackChangesDiffProps {
  original: string;
  suggestion: string;
}

interface DiffSegment {
  type: "equal" | "remove" | "add";
  text: string;
}

function tokenize(text: string): string[] {
  // Split into words and whitespace, preserving boundaries
  return text.match(/\S+|\s+/g) || [];
}

function buildLcsTable(origTokens: string[], suggTokens: string[]) {
  const m = origTokens.length;
  const n = suggTokens.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        origTokens[i - 1] === suggTokens[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  return dp;
}

function backtrackDiff(
  origTokens: string[],
  suggTokens: string[],
  dp: number[][]
): DiffSegment[] {
  const raw: DiffSegment[] = [];
  let i = origTokens.length;
  let j = suggTokens.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origTokens[i - 1] === suggTokens[j - 1]) {
      raw.push({ type: "equal", text: origTokens[i - 1] });
      i -= 1;
      j -= 1;
      continue;
    }

    const shouldAdd = j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j]);
    if (shouldAdd) {
      raw.push({ type: "add", text: suggTokens[j - 1] });
      j -= 1;
      continue;
    }

    raw.push({ type: "remove", text: origTokens[i - 1] });
    i -= 1;
  }

  return raw.reverse();
}

function mergeAdjacentSegments(segments: DiffSegment[]) {
  const merged: DiffSegment[] = [];
  for (const segment of segments) {
    const previous = merged[merged.length - 1];
    if (previous && previous.type === segment.type) {
      previous.text += segment.text;
      continue;
    }
    merged.push({ ...segment });
  }
  return merged;
}

/**
 * Simple word-level diff using longest common subsequence.
 * Compares tokens (words + whitespace) between original and suggestion.
 */
function computeWordDiff(original: string, suggestion: string): DiffSegment[] {
  const origTokens = tokenize(original);
  const suggTokens = tokenize(suggestion);
  const dp = buildLcsTable(origTokens, suggTokens);
  return mergeAdjacentSegments(backtrackDiff(origTokens, suggTokens, dp));
}

export function TrackChangesDiff({ original, suggestion }: TrackChangesDiffProps) {
  if (original === suggestion) {
    return <span>{suggestion}</span>;
  }

  const segments = computeWordDiff(original, suggestion);

  return (
    <span className="whitespace-pre-wrap">
      {segments.map((seg, i) => {
        if (seg.type === "equal") {
          return <span key={i}>{seg.text}</span>;
        }
        if (seg.type === "remove") {
          return (
            <span key={i} className="diff-remove">
              {seg.text}
            </span>
          );
        }
        return (
          <span key={i} className="diff-add">
            {seg.text}
          </span>
        );
      })}
    </span>
  );
}
