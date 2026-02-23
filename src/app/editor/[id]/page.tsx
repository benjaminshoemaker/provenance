import { auth } from "@/auth";
import { db } from "@/lib/db";
import { documents, users, chatThreads } from "@/lib/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { EditorShell } from "./editor-shell";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [document] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), isNull(documents.deletedAt)));

  if (!document) {
    notFound();
  }

  if (document.userId !== session.user.id) {
    redirect("/dashboard");
  }

  const [prefs, threads] = await Promise.all([
    db
      .select({ aiProvider: users.aiProvider, aiModel: users.aiModel })
      .from(users)
      .where(eq(users.id, session.user.id))
      .then((rows) => rows[0]),
    db
      .select({
        id: chatThreads.id,
        title: chatThreads.title,
        messageCount: chatThreads.messageCount,
        updatedAt: chatThreads.updatedAt,
      })
      .from(chatThreads)
      .where(eq(chatThreads.documentId, id))
      .orderBy(desc(chatThreads.updatedAt)),
  ]);

  return (
    <div className="flex h-screen flex-col px-2 py-1">
      <EditorShell
        documentId={document.id}
        initialTitle={document.title}
        initialContent={document.content as Record<string, unknown>}
        aiProvider={prefs?.aiProvider ?? "anthropic"}
        aiModel={prefs?.aiModel ?? null}
        initialChatThreads={threads}
      />
    </div>
  );
}

