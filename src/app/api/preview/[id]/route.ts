import { auth } from "@/auth";
import { db } from "@/lib/db";
import { documents, aiInteractions, pasteEvents } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { extractPlainText } from "@/lib/tiptap-utils";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [document] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), isNull(documents.deletedAt)));

  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (document.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  return NextResponse.json({
    title: document.title,
    content: plainText,
    interactions: interactions.map((i) => ({
      mode: i.mode,
      prompt: i.prompt,
      response: i.response,
      action: i.action,
      createdAt: i.createdAt,
    })),
    pasteEvents: pastes.map((p) => ({
      sourceType: p.sourceType,
      characterCount: p.characterCount,
      createdAt: p.createdAt,
    })),
  });
}
