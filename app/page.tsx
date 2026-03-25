import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FavoriteToggleButton } from "@/components/quotes/favorite-toggle-button";
import { QuoteCard } from "@/components/quotes/quote-card";
import { getSession } from "@/lib/auth/session";
import { getDailyQuoteForUser, getHomeQuotesForUser } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  const userId = session?.user.id ?? null;
  const [dailyQuote, quotes] = await Promise.all([getDailyQuoteForUser(userId), getHomeQuotesForUser(6, userId)]);

  return (
    <>
      <div className="space-y-5 md:hidden">
        <section className="space-y-2">
          <Badge>今日一句</Badge>
          <h1 className="text-xl font-semibold tracking-tight">Today on SourceLines</h1>
          <p className="text-sm text-muted-foreground">同一天内固定显示同一条句子，明天自动更新。</p>
        </section>

        {dailyQuote ? (
          <Card className="border-border/90 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <p className="line-clamp-1 font-sans text-sm text-muted-foreground">{dailyQuote.author?.name ?? "未知作者"}</p>
                {session ? (
                  <div className="pointer-events-auto">
                    <FavoriteToggleButton initialFavorited={Boolean(dailyQuote.favorites && dailyQuote.favorites.length > 0)} quoteId={dailyQuote.id} />
                  </div>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <blockquote className="reading-quote">“{dailyQuote.original_text}”</blockquote>
              {dailyQuote.translation_text ? <p className="reading-secondary">{dailyQuote.translation_text}</p> : null}
              <div className="space-y-1 text-xs text-muted-foreground">
                <p className="line-clamp-1">作品：{dailyQuote.work?.title ?? "未关联作品"}</p>
                <p className="line-clamp-1">出处：{dailyQuote.source_locator ?? "未提供"}</p>
              </div>
              <Link className={`${buttonVariants()} w-full`} href={`/quotes/${dailyQuote.id}`}>
                查看详情
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">当前暂无可展示句子。请先导入数据后重试。</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="hidden space-y-6 md:block md:space-y-10">
        <section className="space-y-3 border-b border-border pb-6 md:space-y-4 md:pb-8">
          <Badge>Reading-first Archive</Badge>
          <h1 className="max-w-3xl text-2xl font-semibold leading-tight tracking-tight md:text-4xl">读到好句子，也知道它从哪里来。</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            SourceLines 以原文为主，兼顾译文与来源信息，适合检索、浏览与收藏。
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Link className={`${buttonVariants()} w-full sm:w-auto`} href="/browse">
              浏览引文
            </Link>
            <Link className={`${buttonVariants({ variant: "outline" })} w-full sm:w-auto`} href="/submit">
              提交引文
            </Link>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
          {quotes.length === 0 ? (
            <p className="col-span-full text-sm text-muted-foreground">
              当前没有可显示的数据。请检查数据库连接并执行 `npm run prisma:seed`。
            </p>
          ) : null}
          {quotes.map((quote) => (
            <QuoteCard key={quote.id} quote={quote} uniformHeight />
          ))}
        </section>
      </div>
    </>
  );
}
