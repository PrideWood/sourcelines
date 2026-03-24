import { prisma } from "@/lib/prisma";

let tableReadyCache: boolean | null = null;

export async function hasSubmissionTagsTable() {
  if (tableReadyCache === true) {
    return true;
  }

  try {
    const rows = await prisma.$queryRaw<Array<{ table_name: string | null }>>`
      SELECT to_regclass('public.submission_tags')::text AS table_name
    `;
    const exists = Boolean(rows[0]?.table_name);
    tableReadyCache = exists ? true : null;
    return exists;
  } catch {
    // 不缓存失败，避免一次偶发错误导致后续长期误判。
    return false;
  }
}

export async function ensureSubmissionTagsTable() {
  if (await hasSubmissionTagsTable()) {
    return true;
  }

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "submission_tags" (
        "submission_id" TEXT NOT NULL,
        "tag_id" TEXT NOT NULL,
        CONSTRAINT "submission_tags_pkey" PRIMARY KEY ("submission_id", "tag_id")
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "submission_tags_tag_id_idx"
      ON "submission_tags" ("tag_id")
    `);
    tableReadyCache = true;
  } catch {
    tableReadyCache = null;
  }

  return tableReadyCache;
}
