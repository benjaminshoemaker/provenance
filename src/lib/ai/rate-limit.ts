import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

const RATE_LIMIT = 20;
const WINDOW_MS = 60_000;

export async function checkRateLimit(
  userId: string
): Promise<{ allowed: boolean }> {
  const windowStart = new Date(Date.now() - WINDOW_MS);

  // Atomic: insert the request log row AND count the window in a single statement
  const result = await db.execute(sql`
    WITH inserted AS (
      INSERT INTO ai_request_log (id, user_id, created_at)
      VALUES (gen_random_uuid(), ${userId}, now())
    )
    SELECT count(*)::int AS count
    FROM ai_request_log
    WHERE user_id = ${userId}
      AND created_at >= ${windowStart}
  `);

  const count = (result.rows[0] as { count: number })?.count ?? 0;
  return { allowed: count < RATE_LIMIT };
}
