import { prisma } from "@/lib/prisma";

let tagSortOrderColumnCache: boolean | null = null;

export async function hasTagSortOrderColumn() {
  if (tagSortOrderColumnCache != null) {
    return tagSortOrderColumnCache;
  }

  try {
    const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'tags'
          AND column_name = 'sort_order'
      ) AS exists
    `;
    const exists = Boolean(rows[0]?.exists);
    tagSortOrderColumnCache = exists;
    return exists;
  } catch {
    return false;
  }
}

export async function ensureTagSortOrderColumn() {
  if (await hasTagSortOrderColumn()) {
    return true;
  }

  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "tags"
      ADD COLUMN IF NOT EXISTS "sort_order" INTEGER NOT NULL DEFAULT 0
    `);

    await prisma.$executeRawUnsafe(`
      WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY tag_type ORDER BY name ASC, created_at ASC) AS rn
        FROM "tags"
      )
      UPDATE "tags" t
      SET "sort_order" = ranked.rn
      FROM ranked
      WHERE t.id = ranked.id
        AND (t."sort_order" IS NULL OR t."sort_order" = 0)
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "tags_tag_type_sort_order_idx"
      ON "tags" ("tag_type", "sort_order")
    `);

    tagSortOrderColumnCache = true;
    return true;
  } catch {
    tagSortOrderColumnCache = null;
    return false;
  }
}
