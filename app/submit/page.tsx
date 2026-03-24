import { SubmitForm } from "@/components/submit/submit-form";
import { prisma } from "@/lib/prisma";
import { hasTagSortOrderColumn } from "@/lib/tag-sort-order";

export const dynamic = "force-dynamic";

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ quoteId?: string }>;
}) {
  const params = await searchParams;
  const quoteId = params.quoteId?.trim() || "";
  const supportsSortOrder = await hasTagSortOrderColumn();

  const [languages, tags, quote] = await Promise.all([
    prisma.language.findMany({
      where: { is_active: true },
      orderBy: { name_en: "asc" },
      select: {
        code: true,
        name_en: true,
        name_native: true,
      },
    }),
    prisma.tag.findMany({
      orderBy: [{ tag_type: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        tag_type: true,
      },
    }),
    quoteId
      ? prisma.quote.findUnique({
          where: { id: quoteId },
          include: {
            author: {
              select: { name: true },
            },
            work: {
              select: { title: true },
            },
            quote_tags: {
              select: { tag_id: true },
            },
          },
        })
      : Promise.resolve(null),
  ]);

  const prefill = quote
    ? {
        quote_id: quote.id,
        original_text: quote.original_text,
        language: quote.original_language,
        raw_work_title: quote.work?.title ?? "",
        raw_author_name: quote.author?.name ?? "",
        raw_source_location: quote.source_locator ?? "",
        raw_translated_text: quote.translation_text ?? "",
        tag_ids: quote.quote_tags.map((item) => item.tag_id),
      }
    : null;

  if (supportsSortOrder && tags.length > 0) {
    const sortRows = await prisma.$queryRaw<Array<{ id: string; sort_order: number }>>`
      SELECT id, sort_order
      FROM tags
    `;
    const sortMap = new Map(sortRows.map((row) => [row.id, Number(row.sort_order ?? 0)]));
    tags.sort((a, b) => {
      if (a.tag_type !== b.tag_type) return String(a.tag_type).localeCompare(String(b.tag_type));
      const aSort = sortMap.get(a.id) ?? 0;
      const bSort = sortMap.get(b.id) ?? 0;
      if (aSort !== bSort) return aSort - bSort;
      return a.name.localeCompare(b.name);
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{prefill ? "补充来源信息" : "投稿引文"}</h1>
        <p className="text-sm text-muted-foreground">
          {prefill ? "已带入当前条目的已知来源信息，请补全或修正空缺字段后提交审核。" : "请尽量提供准确来源与证据，便于审核通过后标准化入库。"}
        </p>
      </header>

      <SubmitForm initialValues={prefill} languages={languages} tags={tags} />
    </div>
  );
}
