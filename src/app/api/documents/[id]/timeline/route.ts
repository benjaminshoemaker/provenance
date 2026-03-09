import { db } from "@/lib/db";
import {
  aiInteractions,
  pasteEvents,
  writingSessions,
  revisions,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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

  const [interactions, pastes, sessions, revs] = await Promise.all([
    db.select().from(aiInteractions).where(eq(aiInteractions.documentId, id)),
    db.select().from(pasteEvents).where(eq(pasteEvents.documentId, id)),
    db.select().from(writingSessions).where(eq(writingSessions.documentId, id)),
    db.select().from(revisions).where(eq(revisions.documentId, id)),
  ]);

  return NextResponse.json(
    {
      interactions: interactions.map(toAuditInteraction),
      pasteEvents: pastes.map(toAuditPasteEvent),
      sessions: sessions.map((s) => ({
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        activeSeconds: s.activeSeconds,
      })),
      revisions: revs.map((r) => ({
        trigger: r.trigger,
        createdAt: r.createdAt,
      })),
    },
    { headers: PRIVATE_HEADERS }
  );
}
