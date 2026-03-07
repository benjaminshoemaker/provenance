import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

const RATE_LIMIT = 20;
const WINDOW_MS = 60_000;

export async function checkRateLimit(
  userId: string
): Promise<{ allowed: boolean }> {
  const windowStart = new Date(Date.now() - WINDOW_MS);

  // Atomic: count first, then insert only if under the limit.
  const result = await db.execute(sql`
    WITH recent AS (
      SELECT count(*)::int AS count
      FROM ai_request_log
      WHERE user_id = ${userId}
        AND created_at >= ${windowStart}
    ),
    inserted AS (
      INSERT INTO ai_request_log (id, user_id, created_at)
      VALUES (gen_random_uuid(), ${userId}, now())
      FROM recent
      WHERE recent.count < ${RATE_LIMIT}
      RETURNING 1
    )
    SELECT
      (SELECT count FROM recent) AS count,
      EXISTS(SELECT 1 FROM inserted) AS inserted
  `);

  const row = (result.rows[0] as { inserted?: boolean }) ?? {};
  return { allowed: row.inserted === true };
}
