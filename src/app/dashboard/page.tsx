import { auth } from "@/auth";
import { db } from "@/lib/db";
import { documents, badges } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { createDocument } from "@/app/actions/documents";
import { DashboardContent } from "@/components/dashboard/DashboardContent";

interface BadgeSummary {
  count: number;
  typedPercentage: number | null;
  latestVerificationId: string | null;
}

type DocumentRow = typeof documents.$inferSelect;

function parseTypedPercentage(statsText: string): number | null {
  try {
    const stats = JSON.parse(statsText) as {
      typed_percentage?: number;
      human_typed_percentage?: number;
    };
    return stats.typed_percentage ?? stats.human_typed_percentage ?? null;
  } catch {
    return null;
  }
}

async function fetchBadgeStatsMap(
  documentIds: string[]
): Promise<Map<string, BadgeSummary>> {
  const statsMap = new Map<string, BadgeSummary>();
  if (documentIds.length === 0) {
    return statsMap;
  }

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
        documentIds.map((id) => sql`${id}`),
        sql`, `
      )})`
    )
    .groupBy(badges.documentId);

  for (const row of badgeRows) {
    statsMap.set(row.documentId, {
      count: row.count,
      typedPercentage: parseTypedPercentage(row.latestStats),
      latestVerificationId: row.latestVerificationId ?? null,
    });
  }

  return statsMap;
}

function extractPreview(content: unknown): string {
  try {
    const doc = content as {
      content?: Array<{
        content?: Array<{ text?: string }>;
      }>;
    };
    const firstParagraph = doc?.content?.find((node) =>
      node.content?.some((child) => child.text)
    );
    return firstParagraph?.content?.map((child) => child.text ?? "").join("") ?? "";
  } catch {
    return "";
  }
}

function toDashboardDocument(
  document: DocumentRow,
  badgeStatsMap: Map<string, BadgeSummary>
) {
  const badgeInfo = badgeStatsMap.get(document.id);
  const preview = extractPreview(document.content);

  return {
    id: document.id,
    title: document.title,
    updatedAt: document.updatedAt,
    wordCount: document.wordCount,
    deletedAt: document.deletedAt,
    preview: preview.slice(0, 100),
    typedPercentage: badgeInfo?.typedPercentage ?? null,
    badgeCount: badgeInfo?.count ?? 0,
    latestBadgeVerificationId: badgeInfo?.latestVerificationId ?? null,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const userDocuments = await db
    .select()
    .from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(desc(documents.updatedAt));

  const badgeStatsMap = await fetchBadgeStatsMap(userDocuments.map((doc) => doc.id));
  const documentData = userDocuments.map((doc) =>
    toDashboardDocument(doc, badgeStatsMap)
  );

  const createAction = async () => {
    "use server";
    return createDocument();
  };

  return (
    <DashboardContent
      documents={documentData}
      referenceNowMs={Date.now()}
      createAction={createAction}
    />
  );
}
