import Link from "next/link";
import { Search } from "lucide-react";

import { QuoteCard } from "@/components/quotes/quote-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSession } from "@/lib/auth/session";
import { searchLibrary } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const session = await getSession();

  const results = await searchLibrary(q, session?.user.id ?? null);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold">搜索</h1>

      <Card>
        <CardContent className="pt-6">
          <form method="get">
            <label className="sr-only" htmlFor="search-input">
              搜索
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input defaultValue={q} id="search-input" className="pl-9" name="q" placeholder="优先搜索句子，也可匹配作者与作品" />
            </div>
          </form>
          <p className="mt-3 text-sm text-muted-foreground">结果顺序：句子优先，其次作者与作品。</p>
        </CardContent>
      </Card>

      {!q ? <p className="text-sm text-muted-foreground">输入关键词开始搜索句子、作者或作品。</p> : null}

      {q ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">句子结果</h2>
          {results.quotes.length === 0 ? <p className="text-sm text-muted-foreground">没有找到匹配句子。</p> : null}
          {results.quotes.map((quote) => (
            <QuoteCard key={quote.id} quote={quote} />
          ))}
        </section>
      ) : null}

      {q ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">作者结果</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {results.authors.length === 0 ? <p className="text-muted-foreground">没有匹配作者。</p> : null}
              {results.authors.map((author) => (
                <Link className="block underline-offset-4 hover:underline" href={`/authors/${author.slug}`} key={author.id}>
                  {author.name}
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">作品结果</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {results.works.length === 0 ? <p className="text-muted-foreground">没有匹配作品。</p> : null}
              {results.works.map((work) => (
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
