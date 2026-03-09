"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useCompletion } from "@ai-sdk/react";
import type { Editor } from "@tiptap/react";
import { logAIInteraction } from "@/app/actions/ai-interactions";
import {
  createSourceId,
  getInlineAIErrorMessage,
  parseSuggestions,
  suggestionDeltaLabel,
} from "./inline-ai-utils";
import {
  InlineAIChooserStage,
  InlineAIToolbarStage,
} from "./InlineAIStages";

interface InlineAIProps {
  editor: Editor;
  documentId: string;
  provider: string;
  model?: string;
  selectedText: string;
  selectionFrom: number;
  selectionTo: number;
  anchorTop?: number;
  anchorRight?: number;
  onDismiss: () => void;
  onAIResponse?: (responseText: string) => void;
}

type Stage = "toolbar" | "choosing";

interface Choice {
  id: string;
  label: string;
  sublabel?: string;
  text: string;
  isOriginal: boolean;
}

type OriginType = "human" | "ai" | "external_paste";

interface OriginAttrs {
  type: OriginType;
  touchedByAI: boolean;
  sourceId?: string | null;
  originalLength?: number | null;
  originalText?: string | null;
}

interface TextSegment {
  text: string;
  origin: OriginAttrs | null;
}

interface WordToken {
  normalized: string;
  origin: OriginAttrs | null;
}

const WORD_MATCHER = /[\p{L}\p{N}]+/gu;
const WORD_SEGMENTER =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "word" })
    : null;

function normalizeToken(token: string): string {
  return token.normalize("NFKC").replace(/\s+/g, " ").trim();
}

function splitIntoWordSegments(text: string): Array<{
  text: string;
  isWordLike: boolean;
}> {
  if (!text) return [];

  if (WORD_SEGMENTER) {
    return Array.from(WORD_SEGMENTER.segment(text)).map((segment) => ({
      text: segment.segment,
      isWordLike: Boolean(segment.isWordLike),
    }));
  }

  WORD_MATCHER.lastIndex = 0;
  const segments: Array<{ text: string; isWordLike: boolean }> = [];
  let lastIndex = 0;
  for (const match of text.matchAll(WORD_MATCHER)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, index),
        isWordLike: false,
      });
    }
    segments.push({ text: match[0], isWordLike: true });
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), isWordLike: false });
  }
  return segments;
}

function isOriginType(value: unknown): value is OriginType {
  return value === "human" || value === "ai" || value === "external_paste";
}

function toOriginAttrs(attrs: Record<string, unknown> | undefined): OriginAttrs {
  return {
    type: isOriginType(attrs?.type) ? attrs.type : "human",
    touchedByAI: Boolean(attrs?.touchedByAI),
    sourceId: typeof attrs?.sourceId === "string" ? attrs.sourceId : null,
    originalLength:
      typeof attrs?.originalLength === "number" ? attrs.originalLength : null,
    originalText: typeof attrs?.originalText === "string" ? attrs.originalText : null,
  };
}

function getSelectionSegments(params: {
  editor: Editor;
  from: number;
  to: number;
}): TextSegment[] {
  const { editor, from, to } = params;
  const segments: TextSegment[] = [];

  editor.state.doc.nodesBetween(from, to, (node, pos) => {
    if (!node.isText || !node.text) return;

    const segmentFrom = Math.max(from, pos);
    const segmentTo = Math.min(to, pos + node.text.length);
    if (segmentTo <= segmentFrom) return;

    const text = node.text.slice(segmentFrom - pos, segmentTo - pos);
    const originMark = node.marks.find((mark) => mark.type.name === "origin");

    segments.push({
      text,
      origin: originMark
        ? toOriginAttrs(originMark.attrs as Record<string, unknown> | undefined)
        : null,
    });
  });

  return segments;
}

function tokenizeSelectionWords(segments: TextSegment[]): WordToken[] {
  const tokens: WordToken[] = [];
  for (const segment of segments) {
    for (const piece of splitIntoWordSegments(segment.text)) {
      if (!piece.isWordLike) continue;
      const normalized = normalizeToken(piece.text);
      if (!normalized) continue;
      tokens.push({
        normalized,
        origin: segment.origin,
      });
    }
  }
  return tokens;
}

function diffWordIndexes(original: string[], rewritten: string[]): Map<number, number | null> {
  const m = original.length;
  const n = rewritten.length;
  const dp = Array.from({ length: m + 1 }, () => Array<number>(n + 1).fill(0));

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] =
        original[i] === rewritten[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const mapping = new Map<number, number | null>();
  let i = 0;
  let j = 0;

  while (i < m && j < n) {
    if (original[i] === rewritten[j]) {
      mapping.set(j, i);
      i++;
      j++;
      continue;
    }

    if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++;
    } else {
      mapping.set(j, null);
      j++;
    }
  }

  while (j < n) {
    mapping.set(j, null);
    j++;
  }

  return mapping;
}

function buildReplacementContent(params: {
  responseText: string;
  sourceId: string;
  selectedWordTokens: WordToken[];
}) {
  const { responseText, sourceId, selectedWordTokens } = params;
  const responseSegments = splitIntoWordSegments(responseText);
  const responseWordTokens = responseSegments
    .filter((segment) => segment.isWordLike)
    .map((segment) => normalizeToken(segment.text))
    .filter(Boolean);
  const selectedWords = selectedWordTokens.map((token) => token.normalized);
  const keptMap = diffWordIndexes(selectedWords, responseWordTokens);

  const nodes: Array<{
    type: "text";
    text: string;
    marks?: Array<{
      type: "origin";
      attrs: OriginAttrs;
    }>;
  }> = [];

  let responseWordIndex = 0;
  for (const segment of responseSegments) {
    let originAttrs: OriginAttrs | null = null;

    if (segment.isWordLike) {
      const selectedWordIndex = keptMap.get(responseWordIndex) ?? null;
      if (selectedWordIndex == null) {
        originAttrs = {
          type: "ai",
          touchedByAI: true,
          sourceId,
          originalLength: segment.text.length,
          originalText: segment.text,
        };
      } else {
        const priorOrigin = selectedWordTokens[selectedWordIndex]?.origin;
        originAttrs = {
          type: priorOrigin?.type ?? "human",
          touchedByAI: true,
          sourceId: priorOrigin?.sourceId ?? null,
          originalLength: priorOrigin?.originalLength ?? null,
          originalText: priorOrigin?.originalText ?? null,
        };
      }
      responseWordIndex++;
    }

    const markPayload = originAttrs
      ? [{ type: "origin" as const, attrs: originAttrs }]
      : undefined;
    const previous = nodes[nodes.length - 1];
    const previousKey = previous?.marks
      ? JSON.stringify(previous.marks[0].attrs)
      : "";
    const currentKey = markPayload ? JSON.stringify(markPayload[0].attrs) : "";

    if (previous && previousKey === currentKey) {
      previous.text += segment.text;
      continue;
    }

    nodes.push(
      markPayload
        ? { type: "text", text: segment.text, marks: markPayload }
        : { type: "text", text: segment.text }
    );
  }

  return nodes;
}

function buildDualSuggestionPrompt(prompt: string) {
  return `${prompt}

Return exactly TWO distinct rewritten options for the selected text.
Do not include explanations.
Use this format exactly:
SUGGESTION 1:
<text>
---
SUGGESTION 2:
<text>`;
}

function getNextChoiceId(params: {
  choices: Choice[];
  selectedChoiceId: string;
  direction: "up" | "down";
}) {
  const { choices, selectedChoiceId, direction } = params;
  const index = choices.findIndex((choice) => choice.id === selectedChoiceId);
  if (index < 0) {
    return choices[0]?.id ?? selectedChoiceId;
  }

  const nextIndex =
    direction === "down"
      ? (index + 1) % choices.length
      : (index - 1 + choices.length) % choices.length;
  return choices[nextIndex].id;
}

export function InlineAI({
  editor,
  documentId,
  provider,
  model,
  selectedText,
  selectionFrom,
  selectionTo,
  anchorTop = 96,
  anchorRight = 24,
  onDismiss,
  onAIResponse,
}: InlineAIProps) {
  const [stage, setStage] = useState<Stage>("toolbar");
  const [promptText, setPromptText] = useState("");
  const [lastPrompt, setLastPrompt] = useState("");
  const [activeAction, setActiveAction] = useState("");
  const [selectedChoiceId, setSelectedChoiceId] = useState("original");
  const [error, setError] = useState<string | null>(null);

  const { completion, complete, isLoading, setCompletion, stop } = useCompletion({
    api: "/api/ai/complete",
    onError: (err) => {
      setError(getInlineAIErrorMessage(err.message || "AI request failed"));
    },
  });

  const choices = useMemo<Choice[]>(() => {
    if (!completion) return [];
    const [suggestionOne, suggestionTwo] = parseSuggestions(completion);

    return [
      {
        id: "original",
        label: "YOUR ORIGINAL",
        text: selectedText,
        isOriginal: true,
      },
      {
        id: "suggestion-1",
        label: "SUGGESTION 1",
        sublabel: suggestionDeltaLabel(selectedText, suggestionOne),
        text: suggestionOne,
        isOriginal: false,
      },
      {
        id: "suggestion-2",
        label: "SUGGESTION 2",
        sublabel: suggestionDeltaLabel(selectedText, suggestionTwo),
        text: suggestionTwo,
        isOriginal: false,
      },
    ];
  }, [completion, selectedText]);

  const handleSubmit = useCallback(
    async (prompt: string, actionName: string) => {
      setLastPrompt(prompt);
      setActiveAction(actionName);
      setError(null);
      setStage("choosing");
      setSelectedChoiceId("original");

      await complete(buildDualSuggestionPrompt(prompt), {
        body: {
          mode: "inline",
          provider,
          model,
          selectedText,
        },
      });
    },
    [complete, provider, model, selectedText]
  );

  const logRejectedCompletion = useCallback(
    (responseText: string) => {
      void logAIInteraction({
        documentId,
        mode: "inline",
        prompt: lastPrompt,
        selectedText,
        response: responseText,
        action: "rejected",
        provider,
        model: model ?? "",
        charactersInserted: 0,
      });
    },
    [documentId, lastPrompt, selectedText, provider, model]
  );

  const handleConfirm = useCallback(async () => {
    const selected = choices.find((choice) => choice.id === selectedChoiceId);
    if (!selected) return;

    if (selected.isOriginal) {
      if (completion) {
        logRejectedCompletion(completion);
      }
      setCompletion("");
      onDismiss();
      return;
    }

    const sourceId = createSourceId();

    await logAIInteraction({
      sourceId,
      documentId,
      mode: "inline",
      prompt: lastPrompt,
      selectedText,
      response: selected.text,
      action: "accepted",
      provider,
      model: model ?? "",
      charactersInserted: selected.text.length,
    });

    const selectedSegments = getSelectionSegments({
      editor,
      from: selectionFrom,
      to: selectionTo,
    });
    const selectedWordTokens = tokenizeSelectionWords(selectedSegments);
    const replacementContent = buildReplacementContent({
      responseText: selected.text,
      sourceId,
      selectedWordTokens,
    });

    editor
      .chain()
      .focus()
      .insertContentAt(
        { from: selectionFrom, to: selectionTo },
        replacementContent.length > 0 ? replacementContent : ""
      )
      .run();

    onAIResponse?.(selected.text);
    setCompletion("");
    onDismiss();
  }, [
    choices,
    selectedChoiceId,
    completion,
    logRejectedCompletion,
    setCompletion,
    onDismiss,
    documentId,
    lastPrompt,
    selectedText,
    provider,
    model,
    editor,
    selectionFrom,
    selectionTo,
    onAIResponse,
  ]);

  const handleDismiss = useCallback(() => {
    if (isLoading) stop();
    if (completion) {
      logRejectedCompletion(completion);
    }
    setCompletion("");
    onDismiss();
  }, [isLoading, stop, completion, logRejectedCompletion, setCompletion, onDismiss]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleDismiss();
        return;
      }

      if (stage !== "choosing" || choices.length === 0) {
        return;
      }

      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        const direction = event.key === "ArrowDown" ? "down" : "up";
        setSelectedChoiceId(
          getNextChoiceId({
            choices,
            selectedChoiceId,
            direction,
          })
        );
      }

      if (event.key === "Enter" && !isLoading) {
        event.preventDefault();
        void handleConfirm();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stage, choices, selectedChoiceId, isLoading, handleConfirm, handleDismiss]);

  if (stage === "toolbar") {
    return (
      <InlineAIToolbarStage
        anchorTop={anchorTop}
        anchorRight={anchorRight}
        selectedText={selectedText}
        promptText={promptText}
        onPromptTextChange={setPromptText}
        onSubmit={handleSubmit}
        onDismiss={handleDismiss}
      />
    );
  }

  return (
    <InlineAIChooserStage
      anchorTop={anchorTop}
      anchorRight={anchorRight}
      selectedText={selectedText}
      activeAction={activeAction}
      choices={choices}
      selectedChoiceId={selectedChoiceId}
      isLoading={isLoading}
      error={error}
      lastPrompt={lastPrompt}
      onRetry={() => {
        if (lastPrompt) {
          void handleSubmit(lastPrompt, activeAction);
        }
      }}
      onSelectChoice={setSelectedChoiceId}
      onConfirm={() => {
        void handleConfirm();
      }}
      onDismiss={handleDismiss}
    />
  );
}
