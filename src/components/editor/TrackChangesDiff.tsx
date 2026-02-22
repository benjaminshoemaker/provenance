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

/**
 * Simple word-level diff using longest common subsequence.
 * Compares tokens (words + whitespace) between original and suggestion.
 */
function computeWordDiff(original: string, suggestion: string): DiffSegment[] {
  const origTokens = tokenize(original);
  const suggTokens = tokenize(suggestion);

  // Build LCS table
  const m = origTokens.length;
  const n = suggTokens.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (origTokens[i - 1] === suggTokens[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find diff
  const segments: DiffSegment[] = [];
  let i = m;
  let j = n;

  const raw: DiffSegment[] = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origTokens[i - 1] === suggTokens[j - 1]) {
      raw.push({ type: "equal", text: origTokens[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      raw.push({ type: "add", text: suggTokens[j - 1] });
      j--;
    } else {
      raw.push({ type: "remove", text: origTokens[i - 1] });
      i--;
    }
  }

  raw.reverse();

  // Merge adjacent segments of the same type
  for (const seg of raw) {
    const last = segments[segments.length - 1];
    if (last && last.type === seg.type) {
      last.text += seg.text;
    } else {
      segments.push({ ...seg });
    }
  }

  return segments;
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
