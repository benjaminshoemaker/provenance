export interface TextSelection {
  text: string;
  from: number;
  to: number;
}

export function areSelectionsEqual(
  current: TextSelection | null,
  next: TextSelection | null
): boolean {
  if (current === next) return true;
  if (!current || !next) return false;
  return (
    current.text === next.text &&
    current.from === next.from &&
    current.to === next.to
  );
}

export function hasDocumentText(content: unknown): boolean {
  if (!content || typeof content !== "object") return false;
  const stack: unknown[] = [content];

  while (stack.length > 0) {
    const node = stack.pop();
    if (!node || typeof node !== "object") continue;
    const record = node as { text?: unknown; content?: unknown[] };

    if (typeof record.text === "string" && record.text.trim().length > 0) {
      return true;
    }

    if (Array.isArray(record.content)) {
      stack.push(...record.content);
    }
  }

  return false;
}

function timelineStateKey(documentId: string): string {
  return `provenance:editor:${documentId}:timeline-open`;
}

export function readTimelineOpenState(documentId: string): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(timelineStateKey(documentId)) === "1";
}

export function writeTimelineOpenState(documentId: string, isOpen: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(timelineStateKey(documentId), isOpen ? "1" : "0");
}
