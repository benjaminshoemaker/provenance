-- Remove legacy badges generated before the authorship-badge redesign cutover.
DELETE FROM "badges"
WHERE "created_at" < TIMESTAMPTZ '2026-03-08T00:00:00Z';
