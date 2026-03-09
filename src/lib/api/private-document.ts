import { auth } from "@/auth";
import { db } from "@/lib/db";
import { aiInteractions, documents, pasteEvents } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
} as const;

type JsonResponse = ReturnType<typeof NextResponse.json>;

type OwnedDocument = typeof documents.$inferSelect;
type Interaction = typeof aiInteractions.$inferSelect;
type PasteEvent = typeof pasteEvents.$inferSelect;

function privateJson(payload: unknown, status: number): JsonResponse {
  return NextResponse.json(payload, { status, headers: PRIVATE_HEADERS });
}

export type OwnedDocumentResult =
  | {
      document: OwnedDocument;
      userId: string;
    }
  | {
      response: JsonResponse;
    };

export async function resolveOwnedDocumentRequest(
  documentId: string
): Promise<OwnedDocumentResult> {
  if (!UUID_RE.test(documentId)) {
    return { response: privateJson({ error: "Not found" }, 404) };
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { response: privateJson({ error: "Unauthorized" }, 401) };
  }

  const [document] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, documentId), isNull(documents.deletedAt)));

  if (!document || document.userId !== userId) {
    return { response: privateJson({ error: "Not found" }, 404) };
  }

  return { document, userId };
}

export function toAuditInteraction(interaction: Interaction) {
  return {
    sourceId: interaction.id,
    mode: interaction.mode,
    prompt: interaction.prompt,
    response: interaction.response,
    action: interaction.action,
    createdAt: interaction.createdAt,
  };
}

export function toAuditPasteEvent(pasteEvent: PasteEvent) {
  return {
    sourceId: pasteEvent.id,
    sourceType: pasteEvent.sourceType,
    characterCount: pasteEvent.characterCount,
    createdAt: pasteEvent.createdAt,
  };
}
