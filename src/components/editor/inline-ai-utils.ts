export const PRESETS = [
  { label: "Improve", prompt: "Improve this text while keeping the same meaning" },
  { label: "Simplify", prompt: "Simplify this text to be more concise and clear" },
  { label: "Expand", prompt: "Expand on this text with more detail" },
  { label: "Fix", prompt: "Fix grammar, spelling, and clarity issues in this text" },
  { label: "More formal", prompt: "Rewrite this text in a more formal tone" },
  { label: "More casual", prompt: "Rewrite this text in a more casual tone" },
];

export function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export function changeRatio(original: string, suggestion: string): number {
  const origWords = original.split(/\s+/).filter(Boolean);
  const suggWords = suggestion.split(/\s+/).filter(Boolean);
  const maxLen = Math.max(origWords.length, suggWords.length);
  if (maxLen === 0) return 0;

  const m = origWords.length;
  const n = suggWords.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        origWords[i - 1] === suggWords[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const common = dp[m][n];
  return 1 - common / maxLen;
}

export function createSourceId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const rand = Math.floor(Math.random() * 16);
    const value = char === "x" ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
}

function cleanSuggestionText(text: string): string {
  return text
    .replace(/^\s*(SUGGESTION|OPTION)\s*\d+\s*:\s*/i, "")
    .trim();
}

export function parseSuggestions(rawCompletion: string): [string, string] {
  const completion = rawCompletion.trim();
  if (!completion) return ["", ""];

  const delimiterMatch = completion
    .split(/\n-{3,}\n/)
    .map((part) => cleanSuggestionText(part))
    .filter(Boolean);
  if (delimiterMatch.length >= 2) {
    return [delimiterMatch[0], delimiterMatch[1]];
  }

  const explicitMatch = completion.match(
    /SUGGESTION\s*1\s*:\s*([\s\S]*?)\n+\s*SUGGESTION\s*2\s*:\s*([\s\S]*)/i
  );
  if (explicitMatch) {
    return [
      cleanSuggestionText(explicitMatch[1]),
      cleanSuggestionText(explicitMatch[2]),
    ];
  }

  const blocks = completion
    .split(/\n{2,}/)
    .map((part) => cleanSuggestionText(part))
    .filter(Boolean);
  if (blocks.length >= 2) {
    return [blocks[0], blocks[1]];
  }

  return [cleanSuggestionText(completion), cleanSuggestionText(completion)];
}

export function suggestionDeltaLabel(
  originalText: string,
  suggestionText: string
): string | undefined {
  const originalWords = wordCount(originalText);
  const suggestionWords = wordCount(suggestionText);
  const diff = originalWords - suggestionWords;
  if (diff > 0) return `· ${diff} fewer word${diff !== 1 ? "s" : ""}`;
  if (diff < 0) {
    const magnitude = Math.abs(diff);
    return `· ${magnitude} more word${magnitude !== 1 ? "s" : ""}`;
  }
  return undefined;
}

export function getInlineAIErrorMessage(message: string): string {
  if (message.includes("429") || message.includes("rate limit")) {
    return "Rate limit exceeded. Please wait a moment and retry.";
  }
  if (message.includes("502") || message.includes("503")) {
    return "AI provider is temporarily unavailable. Please retry.";
  }
  return "Something went wrong. Please try again.";
}
