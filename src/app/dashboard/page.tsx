import { auth } from "@/auth";
import { db } from "@/lib/db";
import { documents, badges } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { createDocument } from "@/app/actions/documents";
import { DashboardContent } from "@/components/dashboard/DashboardContent";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userDocuments = await db
    .select()
    .from(documents)
    .where(eq(documents.userId, session.user.id))
    .orderBy(desc(documents.updatedAt));

  // Fetch badge stats (ai_percentage) per document
  const badgeStatsMap = new Map<
    string,
    { count: number; aiPercentage: number | null; latestVerificationId: string | null }
  >();
  const docIds = userDocuments.map((d) => d.id);
  if (docIds.length > 0) {
    const badgeRows = await db
      .select({
        documentId: badges.documentId,
        count: sql<number>`count(*)::int`,
        latestStats: sql<string>`(array_agg(${badges.stats} ORDER BY ${badges.createdAt} DESC))[1]::text`,
        latestVerificationId: sql<string>`(array_agg(${badges.verificationId} ORDER BY ${badges.createdAt} DESC))[1]::text`,
      })
      .from(badges)
      .where(
        sql`${badges.documentId} IN (${sql.join(
          docIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      )
      .groupBy(badges.documentId);

    for (const row of badgeRows) {
      let aiPercentage: number | null = null;
      try {
        const stats = JSON.parse(row.latestStats);
        aiPercentage = stats?.ai_percentage ?? stats?.aiPercentage ?? null;
      } catch { /* ignore parse errors */ }
      badgeStatsMap.set(row.documentId, {
        count: row.count,
        aiPercentage,
        latestVerificationId: row.latestVerificationId ?? null,
      });
    }
  }

  const documentData = userDocuments.map((doc) => {
    const badgeInfo = badgeStatsMap.get(doc.id);
    // Extract preview from content JSON
    let preview = "";
    try {
      const content = doc.content as { content?: Array<{ content?: Array<{ text?: string }> }> };
      const firstParagraph = content?.content?.find((n) => n.content?.some((c) => c.text));
      preview = firstParagraph?.content?.map((c) => c.text ?? "").join("") ?? "";
    } catch { /* ignore */ }

    return {
      id: doc.id,
      title: doc.title,
      updatedAt: doc.updatedAt,
      wordCount: doc.wordCount,
      deletedAt: doc.deletedAt,
      preview: preview.slice(0, 100),
      aiPercentage: badgeInfo?.aiPercentage ?? null,
      badgeCount: badgeInfo?.count ?? 0,
      latestBadgeVerificationId: badgeInfo?.latestVerificationId ?? null,
    };
  });

  const createAction = async () => {
    "use server";
    const doc = await createDocument();
    redirect(`/editor/${doc.id}`);
  };

  return (
    <DashboardContent
      documents={documentData}
      referenceNowMs={Date.now()}
      createAction={createAction}
    />
  );
}
