import Link from "next/link";
import { difficulty_level, tag_type, verification_status } from "@prisma/client";
import { Search, SlidersHorizontal } from "lucide-react";

import { QuoteCard } from "@/components/quotes/quote-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getQuotesListForUser, searchLibrary } from "@/lib/queries";
import { hasTagSortOrderColumn } from "@/lib/tag-sort-order";

export const dynamic = "force-dynamic";

type BrowseParams = {
  q?: string;
  language?: string;
  verification?: string;
  difficulty?: string;
  tag?: string;
  translated?: string;
};

function chipClass(active: boolean) {
  return active
    ? "rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs text-primary"
    : "rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground";
}

function createBrowseHref(current: BrowseParams, key: keyof BrowseParams, value: string) {
  const next = new URLSearchParams();

  const merged: BrowseParams = {
    q: current.q ?? "",
    language: current.language ?? "",
    verification: current.verification ?? "",
    difficulty: current.difficulty ?? "",
    tag: current.tag ?? "",
    translated: current.translated ?? "",
    [key]: value,
  };

  (Object.keys(merged) as Array<keyof BrowseParams>).forEach((k) => {
    const v = merged[k] ?? "";
    if (v !== "") {
      next.set(k, v);
    }
  });

  const qs = next.toString();
  return qs.length > 0 ? `/browse?${qs}` : "/browse";
}

function FilterSections({
  currentParams,
  language,
  languages,
  difficulty,
  verification,
  translated,
  tag,
  themeTags,
}: {
  currentParams: BrowseParams;
  language: string;
  languages: Array<{ code: string; name_en: string }>;
  difficulty: string;
  verification: string;
  translated: "" | "yes" | "no";
  tag: string;
  themeTags: Array<{ slug: string; name: string }>;
}) {
  return (
    <>
      <section className="space-y-2">
        <p className="text-xs text-muted-foreground">语言</p>
        <div className="flex flex-wrap gap-2">
          <Link className={chipClass(language === "")} href={createBrowseHref(currentParams, "language", "")}>全部</Link>
          {languages.map((item) => (
            <Link className={chipClass(language === item.code)} href={createBrowseHref(currentParams, "language", item.code)} key={item.code}>
              {item.name_en}
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <p className="text-xs text-muted-foreground">难度</p>
        <div className="flex flex-wrap gap-2">
          <Link className={chipClass(difficulty === "")} href={createBrowseHref(currentParams, "difficulty", "")}>全部</Link>
          {Object.values(difficulty_level).map((item) => (
            <Link className={chipClass(difficulty === item)} href={createBrowseHref(currentParams, "difficulty", item)} key={item}>
              {item}
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <p className="text-xs text-muted-foreground">核验状态</p>
        <div className="flex flex-wrap gap-2">
          <Link className={chipClass(verification === "")} href={createBrowseHref(currentParams, "verification", "")}>全部</Link>
          <Link className={chipClass(verification === "UNVERIFIED")} href={createBrowseHref(currentParams, "verification", "UNVERIFIED")}>未核验</Link>
          <Link className={chipClass(verification === "PARTIALLY_VERIFIED")} href={createBrowseHref(currentParams, "verification", "PARTIALLY_VERIFIED")}>
            部分核验
          </Link>
          <Link className={chipClass(verification === "VERIFIED")} href={createBrowseHref(currentParams, "verification", "VERIFIED")}>已核验</Link>
        </div>
      </section>

      <section className="space-y-2">
        <p className="text-xs text-muted-foreground">是否有译文</p>
        <div className="flex flex-wrap gap-2">
          <Link className={chipClass(translated === "")} href={createBrowseHref(currentParams, "translated", "")}>全部</Link>
          <Link className={chipClass(translated === "yes")} href={createBrowseHref(currentParams, "translated", "yes")}>有译文</Link>
          <Link className={chipClass(translated === "no")} href={createBrowseHref(currentParams, "translated", "no")}>无译文</Link>
        </div>
      </section>

      <section className="space-y-2">
        <p className="text-xs text-muted-foreground">主题标签</p>
        <div className="flex flex-wrap gap-2">
          <Link className={chipClass(tag === "")} href={createBrowseHref(currentParams, "tag", "")}>全部</Link>
          {themeTags.map((item) => (
            <Link className={chipClass(tag === item.slug)} href={createBrowseHref(currentParams, "tag", item.slug)} key={item.slug}>
              {item.name}
            </Link>
          ))}
        </div>
      </section>

      <div>
        <Link className="text-xs text-muted-foreground underline-offset-4 hover:underline" href="/browse">
          清空所有条件
        </Link>
      </div>
    </>
  );
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<BrowseParams>;
}) {
  const params = await searchParams;
  const session = await getSession();
  const supportsSortOrder = await hasTagSortOrderColumn();

  const q = (params.q ?? "").trim();
  const language = (params.language ?? "").trim();
  const verification = Object.values(verification_status).includes((params.verification ?? "") as verification_status)
    ? ((params.verification ?? "") as verification_status)
    : "";
  const difficulty = Object.values(difficulty_level).includes((params.difficulty ?? "") as difficulty_level)
    ? ((params.difficulty ?? "") as difficulty_level)
    : "";
  const tag = (params.tag ?? "").trim();
  const translated = params.translated === "yes" || params.translated === "no" ? params.translated : "";

  const currentParams: BrowseParams = {
    q,
    language,
    verification,
    difficulty,
    tag,
    translated,
  };

  const [filteredQuotes, languages, themeTags, searchResults] = await Promise.all([
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
    q ? searchLibrary(q, session?.user.id ?? null) : Promise.resolve(null),
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

  const quotes =
    q && searchResults
      ? filteredQuotes.filter((quote) => searchResults.quotes.some((searchQuote) => searchQuote.id === quote.id))
      : filteredQuotes;

  const verificationLabel =
    verification === "VERIFIED" ? "已核验" : verification === "PARTIALLY_VERIFIED" ? "部分核验" : verification === "UNVERIFIED" ? "未核验" : "";
  const translatedLabel = translated === "yes" ? "有译文" : translated === "no" ? "无译文" : "";
  const tagName = tag ? themeTags.find((item) => item.slug === tag)?.name ?? tag : "";
  const activeFilterHints = [
    language ? `语言 ${language.toUpperCase()}` : "",
    difficulty ? `难度 ${difficulty}` : "",
    verificationLabel,
    translatedLabel,
    tagName ? `主题 ${tagName}` : "",
  ].filter((item) => item.length > 0);
  const activeFilterCount = activeFilterHints.length;

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">浏览</h1>
        <p className="text-sm text-muted-foreground">在同一页面完成看、搜、筛。</p>
      </header>

      <Card>
        <CardContent className="space-y-4 pt-5">
          <form className="space-y-2" method="get">
            <label className="sr-only" htmlFor="browse-search-input">
              搜索
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground md:top-2.5" />
              <Input
                className="pl-9"
                defaultValue={q}
                id="browse-search-input"
                name="q"
                placeholder="搜索句子，也可匹配作者与作品"
              />
            </div>
            {language ? <input name="language" type="hidden" value={language} /> : null}
            {verification ? <input name="verification" type="hidden" value={verification} /> : null}
            {difficulty ? <input name="difficulty" type="hidden" value={difficulty} /> : null}
            {tag ? <input name="tag" type="hidden" value={tag} /> : null}
            {translated ? <input name="translated" type="hidden" value={translated} /> : null}
          </form>

          <div className="md:hidden">
            <details className="rounded-md border border-border/80 bg-muted/20 px-3 py-2">
              <summary className="list-none cursor-pointer [&::-webkit-details-marker]:hidden">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                    <span className="font-sans text-sm font-medium">筛选条件</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{activeFilterCount > 0 ? `已启用 ${activeFilterCount} 项` : "未启用"}</span>
                </div>
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                  {activeFilterCount > 0 ? activeFilterHints.slice(0, 2).join(" · ") : "点击展开筛选"}
                </p>
              </summary>
              <div className="mt-3 space-y-4 border-t border-border/70 pt-3">
                <FilterSections
                  currentParams={currentParams}
                  difficulty={difficulty}
                  language={language}
                  languages={languages}
                  tag={tag}
                  themeTags={themeTags}
                  translated={translated}
                  verification={verification}
                />
              </div>
            </details>
          </div>

          <div className="hidden space-y-4 md:block">
            <FilterSections
              currentParams={currentParams}
              difficulty={difficulty}
              language={language}
              languages={languages}
              tag={tag}
              themeTags={themeTags}
              translated={translated}
              verification={verification}
            />
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">句子</h2>
        {quotes.length === 0 ? <p className="text-sm text-muted-foreground">没有找到符合条件的句子。</p> : null}
        {quotes.map((quote) => (
          <QuoteCard key={quote.id} quote={quote} />
        ))}
      </section>

      {q && searchResults ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">相关作者</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {searchResults.authors.length === 0 ? <p className="text-muted-foreground">没有匹配作者。</p> : null}
              {searchResults.authors.map((author) => (
                <Link className="block underline-offset-4 hover:underline" href={`/authors/${author.slug}`} key={author.id}>
                  {author.name}
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">相关作品</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {searchResults.works.length === 0 ? <p className="text-muted-foreground">没有匹配作品。</p> : null}
              {searchResults.works.map((work) => (
                <Link className="block underline-offset-4 hover:underline" href={`/works/${work.slug}`} key={work.id}>
                  {work.title}
                  <span className="ml-2 text-muted-foreground">{work.author?.name ?? ""}</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
