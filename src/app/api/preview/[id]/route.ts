import { auth } from "@/auth";
import { db } from "@/lib/db";
import { documents, aiInteractions, pasteEvents } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { extractPlainText } from "@/lib/tiptap-utils";
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
    },
    { headers: PRIVATE_HEADERS }
  );
}
