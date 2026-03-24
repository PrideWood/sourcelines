import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { QuoteCard } from "@/components/quotes/quote-card";
import { getSession } from "@/lib/auth/session";
import { getHomeQuotesForUser } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  const quotes = await getHomeQuotesForUser(6, session?.user.id ?? null);

  return (
    <div className="space-y-10">
      <section className="space-y-4 border-b border-border pb-8">
        <Badge>Reading-first Archive</Badge>
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">读到好句子，也知道它从哪里来。</h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          SourceLines 以原文为主，兼顾译文与来源信息，适合检索、浏览与收藏。
        </p>
        <div className="flex gap-3">
          <Link className={buttonVariants()} href="/quotes">
            浏览引文
          </Link>
          <Link className={buttonVariants({ variant: "outline" })} href="/submit">
            提交引文
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
  );
}
