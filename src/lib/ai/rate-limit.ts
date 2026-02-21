import { db } from "@/lib/db";
import { aiRequestLog } from "@/lib/db/schema";
import { eq, gte, and, sql } from "drizzle-orm";

const RATE_LIMIT = 20;
const WINDOW_MS = 60_000;

export async function checkRateLimit(
  userId: string
): Promise<{ allowed: boolean }> {
  const windowStart = new Date(Date.now() - WINDOW_MS);

  // Log this request
  await db.insert(aiRequestLog).values({ userId });

  // Count requests in the window
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(aiRequestLog)
    .where(
      and(
        eq(aiRequestLog.userId, userId),
        gte(aiRequestLog.createdAt, windowStart)
      )
    );

  return { allowed: (result[0]?.count ?? 0) <= RATE_LIMIT };
}
