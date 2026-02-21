import { auth } from "@/auth";
import { db } from "@/lib/db";
import { badges, documents } from "@/lib/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const documentId = request.nextUrl.searchParams.get("documentId");

  if (!documentId) {
    return NextResponse.json(
      { error: "documentId required" },
      { status: 400 }
    );
  }

  // Verify document ownership
  const [document] = await db
    .select()
    .from(documents)
    .where(
      and(eq(documents.id, documentId), isNull(documents.deletedAt))
    );

  if (!document || document.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const documentBadges = await db
    .select({
      id: badges.id,
      verificationId: badges.verificationId,
      stats: badges.stats,
      createdAt: badges.createdAt,
    })
    .from(badges)
    .where(eq(badges.documentId, documentId))
    .orderBy(desc(badges.createdAt));

  return NextResponse.json(documentBadges);
}
