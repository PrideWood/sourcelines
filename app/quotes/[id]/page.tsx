import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FavoriteToggleButton } from "@/components/quotes/favorite-toggle-button";
import { getSession } from "@/lib/auth/session";
import { getQuoteByIdForUser } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const quote = await getQuoteByIdForUser(id, session?.user.id ?? null);

  if (!quote) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">引文详情</h1>
        <p className="text-sm text-muted-foreground">作者：{quote.author?.name ?? "未知作者"}</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <blockquote className="reading-quote">“{quote.original_text}”</blockquote>
          {quote.translation_text ? <p className="reading-secondary">{quote.translation_text}</p> : null}

          <dl className="mt-8 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <div>
              <dt className="font-sans text-muted-foreground">作品</dt>
              <dd>{quote.work?.title ?? "未关联作品"}</dd>
            </div>
            <div>
              <dt className="font-sans text-muted-foreground">语言</dt>
              <dd>{quote.original_language.toUpperCase()}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="font-sans text-muted-foreground">标签</dt>
              <dd className="mt-1 flex flex-wrap gap-2">
                {quote.quote_tags.map((item) => (
                  <Badge key={item.tag_id}>{item.tag.name}</Badge>
                ))}
              </dd>
            </div>
          </dl>

          <div className="mt-8 flex gap-2">
            <FavoriteToggleButton initialFavorited={Boolean(quote.favorites && quote.favorites.length > 0)} quoteId={quote.id} />
            <Link className={buttonVariants({ variant: "outline" })} href="/submit">
              补充来源信息
            </Link>
          </div>
        </CardContent>
      </Card>
    </article>
  );
}
