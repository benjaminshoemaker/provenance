import { db } from "@/lib/db";
import { aiInteractions, documents } from "@/lib/db/schema";
import { eq, gte, and, sql } from "drizzle-orm";

const RATE_LIMIT = 20;
const WINDOW_MS = 60_000;

export async function checkRateLimit(
  userId: string
): Promise<{ allowed: boolean }> {
  const windowStart = new Date(Date.now() - WINDOW_MS);

  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(aiInteractions)
    .innerJoin(documents, eq(aiInteractions.documentId, documents.id))
    .where(
      and(
        eq(documents.userId, userId),
        gte(aiInteractions.createdAt, windowStart)
      )
    );

  return { allowed: (result[0]?.count ?? 0) < RATE_LIMIT };
}
