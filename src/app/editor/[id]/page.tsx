import { auth } from "@/auth";
import { db } from "@/lib/db";
import { documents, users, chatThreads, badges } from "@/lib/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { EditorShell } from "./editor-shell";

async function requireSessionUserId() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/login");
  }
  return userId;
}

async function getOwnedDocument(documentId: string, userId: string) {
  const [document] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, documentId), isNull(documents.deletedAt)));

  if (!document) {
    notFound();
  }

  if (document.userId !== userId) {
    redirect("/dashboard");
  }

  return document;
}

async function loadEditorMetadata(userId: string, documentId: string) {
  return Promise.all([
    db
      .select({ aiProvider: users.aiProvider, aiModel: users.aiModel })
      .from(users)
      .where(eq(users.id, userId))
      .then((rows) => rows[0]),
    db
      .select({
        id: chatThreads.id,
        title: chatThreads.title,
        messageCount: chatThreads.messageCount,
        updatedAt: chatThreads.updatedAt,
      })
      .from(chatThreads)
      .where(eq(chatThreads.documentId, documentId))
      .orderBy(desc(chatThreads.updatedAt)),
    db
      .select({ verificationId: badges.verificationId })
      .from(badges)
      .where(eq(badges.documentId, documentId))
      .orderBy(desc(badges.createdAt)),
  ]);
}

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireSessionUserId();
  const document = await getOwnedDocument(id, userId);
  const [prefs, threads, badgeRows] = await loadEditorMetadata(userId, id);

  return (
    <div className="flex h-screen flex-col px-2 py-1">
      <EditorShell
        documentId={document.id}
        initialTitle={document.title}
        initialContent={document.content as Record<string, unknown>}
        aiProvider={prefs?.aiProvider ?? "anthropic"}
        aiModel={prefs?.aiModel ?? null}
        latestBadgeVerificationId={badgeRows[0]?.verificationId ?? null}
        badgeCount={badgeRows.length}
        initialChatThreads={threads}
      />
    </div>
  );
}
