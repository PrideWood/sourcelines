"use server";

import { Prisma, tag_type } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ensureTagSortOrderColumn, hasTagSortOrderColumn } from "@/lib/tag-sort-order";

const allowedTagTypes = new Set(Object.values(tag_type));

const defaultTagSeed: Array<{ name: string; slug: string; tag_type: tag_type }> = [
  { name: "影视", slug: "source-film", tag_type: tag_type.SOURCE },
  { name: "文学", slug: "source-literature", tag_type: tag_type.SOURCE },
  { name: "诗歌", slug: "source-poetry", tag_type: tag_type.SOURCE },
  { name: "戏剧", slug: "source-drama", tag_type: tag_type.SOURCE },
  { name: "演讲", slug: "source-speech", tag_type: tag_type.SOURCE },
  { name: "歌词", slug: "source-lyrics", tag_type: tag_type.SOURCE },
  { name: "爱情", slug: "theme-love", tag_type: tag_type.THEME },
  { name: "孤独", slug: "theme-solitude", tag_type: tag_type.THEME },
  { name: "成长", slug: "theme-growth", tag_type: tag_type.THEME },
  { name: "记忆", slug: "theme-memory", tag_type: tag_type.THEME },
  { name: "时间", slug: "theme-time", tag_type: tag_type.THEME },
  { name: "告别", slug: "theme-farewell", tag_type: tag_type.THEME },
  { name: "重逢", slug: "theme-reunion", tag_type: tag_type.THEME },
  { name: "命运", slug: "theme-fate", tag_type: tag_type.THEME },
  { name: "自由", slug: "theme-freedom", tag_type: tag_type.THEME },
  { name: "家庭", slug: "theme-family", tag_type: tag_type.THEME },
  { name: "青春", slug: "theme-youth", tag_type: tag_type.THEME },
  { name: "希望", slug: "theme-hope", tag_type: tag_type.THEME },
  { name: "友情", slug: "theme-friendship", tag_type: tag_type.THEME },
  { name: "自我", slug: "theme-self", tag_type: tag_type.THEME },
  { name: "A1", slug: "learning-a1", tag_type: tag_type.LEARNING },
  { name: "A2", slug: "learning-a2", tag_type: tag_type.LEARNING },
  { name: "B1", slug: "learning-b1", tag_type: tag_type.LEARNING },
  { name: "B2", slug: "learning-b2", tag_type: tag_type.LEARNING },
  { name: "C1", slug: "learning-c1", tag_type: tag_type.LEARNING },
  { name: "C2", slug: "learning-c2", tag_type: tag_type.LEARNING },
];

function normalize(input: FormDataEntryValue | null) {
  return String(input ?? "").trim();
}

function toBaseSlug(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function getNextSortOrder(type: tag_type) {
  if (!((await ensureTagSortOrderColumn()) || (await hasTagSortOrderColumn()))) {
    const count = await prisma.tag.count({ where: { tag_type: type } });
    return count + 1;
  }
  const rows = await prisma.$queryRaw<Array<{ max_sort: number | null }>>`
    SELECT MAX(sort_order) AS max_sort
    FROM tags
    WHERE tag_type = ${type}::tag_type
  `;
  return Number(rows[0]?.max_sort ?? 0) + 1;
}

async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent("/admin/tags")}`);
  }
  if (session.user.role !== "ADMIN") {
    redirect("/");
  }
}

export async function createTagAction(formData: FormData) {
  await requireAdmin();

  const name = normalize(formData.get("name"));
  const slugInput = normalize(formData.get("slug"));
  const typeRaw = normalize(formData.get("tag_type"));
  const parentId = normalize(formData.get("parent_id"));
  const description = normalize(formData.get("description"));

  if (!name) {
    redirect("/admin/tags?error=create_missing_name");
  }

  if (!allowedTagTypes.has(typeRaw as tag_type)) {
    redirect("/admin/tags?error=create_invalid_type");
  }

  const slug = toBaseSlug(slugInput || name);
  if (!slug) {
    redirect("/admin/tags?error=create_invalid_slug");
  }

  try {
    const sortOrder = await getNextSortOrder(typeRaw as tag_type);
    const withSortOrder = (await ensureTagSortOrderColumn()) || (await hasTagSortOrderColumn());
    const created = await prisma.tag.create({
      data: {
        name,
        slug,
        tag_type: typeRaw as tag_type,
        parent_id: parentId || null,
        description: description || null,
      },
      select: { id: true },
    });
    if (withSortOrder) {
      await prisma.$executeRaw`
        UPDATE tags
        SET sort_order = ${sortOrder}
        WHERE id = ${created.id}
      `;
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        redirect("/admin/tags?error=create_duplicate_slug");
      }
      if (error.code === "P2003") {
        redirect("/admin/tags?error=create_invalid_parent");
      }
    }
    console.error("[createTagAction] failed", error);
    redirect("/admin/tags?error=create_failed");
  }

  revalidatePath("/admin/tags");
  revalidatePath("/submit");
  redirect("/admin/tags?created=1");
}

export async function updateTagAction(formData: FormData) {
  await requireAdmin();

  const id = normalize(formData.get("id"));
  const name = normalize(formData.get("name"));
  const slugInput = normalize(formData.get("slug"));
  const typeRaw = normalize(formData.get("tag_type"));
  const parentId = normalize(formData.get("parent_id"));
  const description = normalize(formData.get("description"));

  if (!id || !name) {
    redirect("/admin/tags?error=update_missing_required");
  }

  if (!allowedTagTypes.has(typeRaw as tag_type)) {
    redirect("/admin/tags?error=update_invalid_type");
  }

  const slug = toBaseSlug(slugInput || name);
  if (!slug) {
    redirect("/admin/tags?error=update_invalid_slug");
  }

  if (parentId && parentId === id) {
    redirect("/admin/tags?error=update_invalid_parent");
  }

  try {
    const existing = await prisma.tag.findUnique({
      where: { id },
      select: { tag_type: true },
    });
    if (!existing) {
      redirect("/admin/tags?error=update_not_found");
    }

    const nextType = typeRaw as tag_type;
    const typeChanged = existing.tag_type !== nextType;
    const sortOrder = typeChanged ? await getNextSortOrder(nextType) : undefined;
    const withSortOrder = (await ensureTagSortOrderColumn()) || (await hasTagSortOrderColumn());

    await prisma.tag.update({
      where: { id },
      data: {
        name,
        slug,
        tag_type: nextType,
        parent_id: parentId || null,
        description: description || null,
      },
    });
    if (typeChanged && sortOrder != null && withSortOrder) {
      await prisma.$executeRaw`
        UPDATE tags
        SET sort_order = ${sortOrder}
        WHERE id = ${id}
      `;
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        redirect("/admin/tags?error=update_duplicate_slug");
      }
      if (error.code === "P2003") {
        redirect("/admin/tags?error=update_invalid_parent");
      }
      if (error.code === "P2025") {
        redirect("/admin/tags?error=update_not_found");
      }
    }
    console.error("[updateTagAction] failed", error);
    redirect("/admin/tags?error=update_failed");
  }

  revalidatePath("/admin/tags");
  revalidatePath("/submit");
  redirect("/admin/tags?updated=1");
}

export async function reorderTagsAction(input: { tagType: tag_type; orderedIds: string[] }) {
  await requireAdmin();
  if (!((await ensureTagSortOrderColumn()) || (await hasTagSortOrderColumn()))) {
    return { ok: false as const, message: "数据库未启用 sort_order 字段，请先执行迁移。" };
  }

  const tagType = input?.tagType;
  const orderedIds = Array.isArray(input?.orderedIds) ? input.orderedIds.map((id) => id.trim()).filter(Boolean) : [];

  if (!allowedTagTypes.has(tagType)) {
    return { ok: false as const, message: "标签分类无效。" };
  }
  if (orderedIds.length === 0) {
    return { ok: false as const, message: "排序数据为空。" };
  }

  const tags = await prisma.tag.findMany({
    where: { tag_type: tagType },
    orderBy: [{ name: "asc" }],
    select: { id: true },
  });
  const currentIds = tags.map((item) => item.id);
  if (currentIds.length !== orderedIds.length) {
    return { ok: false as const, message: "标签数量不一致，请刷新后重试。" };
  }
  const currentSet = new Set(currentIds);
  if (orderedIds.some((id) => !currentSet.has(id))) {
    return { ok: false as const, message: "排序中包含非法标签，请刷新后重试。" };
  }

  for (let i = 0; i < orderedIds.length; i += 1) {
    await prisma.$executeRaw`
      UPDATE tags
      SET sort_order = ${i + 1}
      WHERE id = ${orderedIds[i]}
    `;
  }

  revalidatePath("/admin/tags");
  revalidatePath("/submit");
  revalidatePath("/quotes");

  return { ok: true as const, message: "标签顺序已保存。" };
}

export async function initializeDefaultTagsAction() {
  await requireAdmin();

  const slugs = defaultTagSeed.map((item) => item.slug);

  try {
    const withSortOrder = (await ensureTagSortOrderColumn()) || (await hasTagSortOrderColumn());
    const existing = await prisma.tag.findMany({
      where: { slug: { in: slugs } },
      select: { slug: true },
    });
    const existingSlugSet = new Set(existing.map((item) => item.slug));

    const toCreate = defaultTagSeed.filter((item) => !existingSlugSet.has(item.slug));
    if (toCreate.length > 0) {
      await prisma.tag.createMany({
        data: toCreate.map((item) => ({
          name: item.name,
          slug: item.slug,
          tag_type: item.tag_type,
        })),
        skipDuplicates: true,
      });
      if (withSortOrder) {
        await ensureTagSortOrderColumn();
      }
    }

    const added = toCreate.length;
    const skipped = defaultTagSeed.length - added;

    revalidatePath("/admin/tags");
    revalidatePath("/submit");
    redirect(`/admin/tags?initialized=1&added=${added}&skipped=${skipped}`);
  } catch (error) {
    console.error("[initializeDefaultTagsAction] failed", error);
    redirect("/admin/tags?error=init_failed");
  }
}
