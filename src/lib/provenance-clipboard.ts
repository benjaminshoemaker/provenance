export const PROVENANCE_INTERNAL_CLIPBOARD_MIME =
  "application/x-provenance-internal";
export const PROVENANCE_AI_SIDEBAR_CLIPBOARD_MIME =
  "application/x-provenance-ai-sidebar";
export const PROVENANCE_CLIPBOARD_VERSION = 1;
export const PROVENANCE_CLIPBOARD_MAX_AGE_MS = 5 * 60 * 1000;

export interface ProvenanceClipboardPayload {
  version: number;
  documentId: string;
  sessionToken: string;
  copiedAt: number;
}

export function createProvenanceClipboardPayload(params: {
  documentId: string;
  sessionToken: string;
  copiedAt?: number;
}): ProvenanceClipboardPayload {
  const { documentId, sessionToken, copiedAt = Date.now() } = params;
  return {
    version: PROVENANCE_CLIPBOARD_VERSION,
    documentId,
    sessionToken,
    copiedAt,
  };
}

export function parseProvenanceClipboardPayload(
  raw: string | null | undefined
): ProvenanceClipboardPayload | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as Record<string, unknown>).version !== "number" ||
      typeof (parsed as Record<string, unknown>).documentId !== "string" ||
      typeof (parsed as Record<string, unknown>).sessionToken !== "string" ||
      typeof (parsed as Record<string, unknown>).copiedAt !== "number"
    ) {
      return null;
    }

    return parsed as ProvenanceClipboardPayload;
  } catch {
    return null;
  }
}

export function isValidProvenanceClipboardPayload(params: {
  payload: ProvenanceClipboardPayload | null;
  documentId: string;
  sessionToken: string;
  maxAgeMs?: number;
}): boolean {
  const { payload, documentId, sessionToken, maxAgeMs } = params;
  if (!payload) return false;

  if (payload.version !== PROVENANCE_CLIPBOARD_VERSION) return false;
  if (payload.documentId !== documentId) return false;
  if (payload.sessionToken !== sessionToken) return false;
  if (!Number.isFinite(payload.copiedAt)) return false;

  const ageMs = Date.now() - payload.copiedAt;
  const ttl = maxAgeMs ?? PROVENANCE_CLIPBOARD_MAX_AGE_MS;
  if (ageMs < 0) return false;
  if (ageMs > ttl) return false;

  return true;
}
