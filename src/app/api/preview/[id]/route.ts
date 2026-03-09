import { db } from "@/lib/db";
import { aiInteractions, pasteEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { extractPlainText } from "@/lib/tiptap-utils";
import {
  PRIVATE_HEADERS,
  resolveOwnedDocumentRequest,
  toAuditInteraction,
  toAuditPasteEvent,
} from "@/lib/api/private-document";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ownedDocument = await resolveOwnedDocumentRequest(id);
  if ("response" in ownedDocument) {
    return ownedDocument.response;
  }
  const { document } = ownedDocument;

  const [interactions, pastes] = await Promise.all([
    db
      .select()
      .from(aiInteractions)
      .where(eq(aiInteractions.documentId, id)),
    db
      .select()
      .from(pasteEvents)
      .where(eq(pasteEvents.documentId, id)),
  ]);

  const content = document.content as Parameters<typeof extractPlainText>[0];
  const plainText = extractPlainText(content);

  return NextResponse.json(
    {
      title: document.title,
      content: plainText,
      interactions: interactions.map(toAuditInteraction),
      pasteEvents: pastes.map(toAuditPasteEvent),
    },
    { headers: PRIVATE_HEADERS }
  );
}
