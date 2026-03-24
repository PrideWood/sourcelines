import Link from "next/link";
import { difficulty_level, tag_type, verification_status } from "@prisma/client";

import { QuoteCard } from "@/components/quotes/quote-card";
import { Card, CardContent } from "@/components/ui/card";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getQuotesListForUser } from "@/lib/queries";
import { hasTagSortOrderColumn } from "@/lib/tag-sort-order";

export const dynamic = "force-dynamic";

type QuotesFilterParams = {
  language?: string;
  verification?: string;
  difficulty?: string;
  tag?: string;
  translated?: string;
};

function chipClass(active: boolean) {
  return active
    ? "rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary"
    : "rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground";
}

function createFilterHref(current: QuotesFilterParams, key: keyof QuotesFilterParams, value: string) {
  const next = new URLSearchParams();

  const merged: QuotesFilterParams = {
    language: current.language ?? "",
    verification: current.verification ?? "",
    difficulty: current.difficulty ?? "",
    tag: current.tag ?? "",
    translated: current.translated ?? "",
    [key]: value,
  };

  (Object.keys(merged) as Array<keyof QuotesFilterParams>).forEach((k) => {
    const v = merged[k] ?? "";
    if (v !== "") {
      next.set(k, v);
    }
  });

  const qs = next.toString();
  return qs.length > 0 ? `/quotes?${qs}` : "/quotes";
}

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<QuotesFilterParams>;
}) {
  const params = await searchParams;
  const session = await getSession();
  const supportsSortOrder = await hasTagSortOrderColumn();

  const language = (params.language ?? "").trim();
  const verification = Object.values(verification_status).includes((params.verification ?? "") as verification_status)
    ? ((params.verification ?? "") as verification_status)
    : "";
  const difficulty = Object.values(difficulty_level).includes((params.difficulty ?? "") as difficulty_level)
    ? ((params.difficulty ?? "") as difficulty_level)
    : "";
  const tag = (params.tag ?? "").trim();
  const translated = params.translated === "yes" || params.translated === "no" ? params.translated : "";

  const currentParams: QuotesFilterParams = {
    language,
    verification,
    difficulty,
    tag,
    translated,
  };

  const [quotes, languages, themeTags] = await Promise.all([
    getQuotesListForUser(session?.user.id ?? null, {
      language: language || undefined,
      verificationStatus: verification || undefined,
      difficultyLevel: difficulty || undefined,
      tagSlug: tag || undefined,
      translated: translated === "" ? undefined : (translated as "yes" | "no"),
    }),
    prisma.language.findMany({
      where: { is_active: true },
      orderBy: { name_en: "asc" },
      select: { code: true, name_en: true },
    }),
    prisma.tag.findMany({
      where: { tag_type: tag_type.THEME },
      orderBy: [{ name: "asc" }],
      take: 16,
      select: { slug: true, name: true },
    }),
  ]);

  if (supportsSortOrder && themeTags.length > 0) {
    const sortRows = await prisma.$queryRaw<Array<{ slug: string; sort_order: number }>>`
      SELECT slug, sort_order
      FROM tags
      WHERE tag_type = 'THEME'
    `;
    const sortMap = new Map(sortRows.map((row) => [row.slug, Number(row.sort_order ?? 0)]));
    themeTags.sort((a, b) => {
      const aSort = sortMap.get(a.slug) ?? 0;
      const bSort = sortMap.get(b.slug) ?? 0;
      if (aSort !== bSort) return aSort - bSort;
      return a.name.localeCompare(b.name);
    });
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Explore 句子</h1>
        <p className="text-muted-foreground">按条件点选筛选句子，保持轻量、可回退、可分享 URL。</p>
      </header>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <section className="space-y-2">
            <p className="text-xs text-muted-foreground">语言</p>
            <div className="flex flex-wrap gap-2">
              <Link className={chipClass(language === "")} href={createFilterHref(currentParams, "language", "")}>全部</Link>
              {languages.map((item) => (
                <Link
                  className={chipClass(language === item.code)}
                  href={createFilterHref(currentParams, "language", item.code)}
                  key={item.code}
                >
                  {item.name_en}
                </Link>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-xs text-muted-foreground">难度</p>
            <div className="flex flex-wrap gap-2">
              <Link className={chipClass(difficulty === "")} href={createFilterHref(currentParams, "difficulty", "")}>全部</Link>
              {Object.values(difficulty_level).map((item) => (
                <Link
                  className={chipClass(difficulty === item)}
                  href={createFilterHref(currentParams, "difficulty", item)}
                  key={item}
                >
                  {item}
                </Link>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-xs text-muted-foreground">核验状态</p>
            <div className="flex flex-wrap gap-2">
              <Link className={chipClass(verification === "")} href={createFilterHref(currentParams, "verification", "")}>全部</Link>
              <Link className={chipClass(verification === "UNVERIFIED")} href={createFilterHref(currentParams, "verification", "UNVERIFIED")}>未核验</Link>
              <Link
                className={chipClass(verification === "PARTIALLY_VERIFIED")}
                href={createFilterHref(currentParams, "verification", "PARTIALLY_VERIFIED")}
              >
                部分核验
              </Link>
              <Link className={chipClass(verification === "VERIFIED")} href={createFilterHref(currentParams, "verification", "VERIFIED")}>已核验</Link>
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-xs text-muted-foreground">是否有译文</p>
            <div className="flex flex-wrap gap-2">
              <Link className={chipClass(translated === "")} href={createFilterHref(currentParams, "translated", "")}>全部</Link>
              <Link className={chipClass(translated === "yes")} href={createFilterHref(currentParams, "translated", "yes")}>有译文</Link>
              <Link className={chipClass(translated === "no")} href={createFilterHref(currentParams, "translated", "no")}>无译文</Link>
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-xs text-muted-foreground">主题标签</p>
            <div className="flex flex-wrap gap-2">
              <Link className={chipClass(tag === "")} href={createFilterHref(currentParams, "tag", "")}>全部</Link>
              {themeTags.map((item) => (
                <Link className={chipClass(tag === item.slug)} href={createFilterHref(currentParams, "tag", item.slug)} key={item.slug}>
                  {item.name}
                </Link>
              ))}
            </div>
          </section>

          <div>
            <Link className="text-xs text-muted-foreground underline-offset-4 hover:underline" href="/quotes">
              清空所有条件
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {quotes.length === 0 ? <p className="text-sm text-muted-foreground">未找到符合条件的句子。</p> : null}
        {quotes.map((quote) => (
          <QuoteCard key={quote.id} quote={quote} />
        ))}
      </div>
    </div>
  );
}
