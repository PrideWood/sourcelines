-- Add sort order for stable, user-defined ordering inside each tag type
ALTER TABLE "tags"
ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;

-- Backfill a deterministic initial order by current name within each type
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY tag_type ORDER BY name ASC, created_at ASC) AS rn
  FROM "tags"
)
UPDATE "tags" t
SET "sort_order" = ranked.rn
FROM ranked
WHERE t.id = ranked.id;

CREATE INDEX "tags_tag_type_sort_order_idx" ON "tags"("tag_type", "sort_order");
