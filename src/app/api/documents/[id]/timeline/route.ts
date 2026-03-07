import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  documents,
  aiInteractions,
  pasteEvents,
  writingSessions,
  revisions,
} from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
} as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: PRIVATE_HEADERS });
  }

  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: PRIVATE_HEADERS });
  }

  const [document] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), isNull(documents.deletedAt)));

  if (!document || document.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: PRIVATE_HEADERS });
  }

  const [interactions, pastes, sessions, revs] = await Promise.all([
    db.select().from(aiInteractions).where(eq(aiInteractions.documentId, id)),
    db.select().from(pasteEvents).where(eq(pasteEvents.documentId, id)),
    db.select().from(writingSessions).where(eq(writingSessions.documentId, id)),
    db.select().from(revisions).where(eq(revisions.documentId, id)),
  ]);

  return NextResponse.json(
    {
      interactions: interactions.map((i) => ({
        sourceId: i.id,
        mode: i.mode,
        prompt: i.prompt,
        response: i.response,
        action: i.action,
        createdAt: i.createdAt,
      })),
      pasteEvents: pastes.map((p) => ({
        sourceId: p.id,
        sourceType: p.sourceType,
        characterCount: p.characterCount,
        createdAt: p.createdAt,
      })),
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
