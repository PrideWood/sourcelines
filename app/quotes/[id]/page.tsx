import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FavoriteToggleButton } from "@/components/quotes/favorite-toggle-button";
import { SharePosterButton } from "@/components/quotes/share-poster-button";
import { getSession } from "@/lib/auth/session";
import { getQuoteByIdForUser } from "@/lib/queries";
import { formatTagLabel } from "@/lib/tag-display";

export const dynamic = "force-dynamic";

export default async function QuoteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ revision_submitted?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
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
        {query.revision_submitted === "1" ? (
          <p className="text-sm text-green-700">你的补充信息已提交，待管理员审核通过后生效。</p>
        ) : null}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-end">
            <FavoriteToggleButton initialFavorited={Boolean(quote.favorites && quote.favorites.length > 0)} quoteId={quote.id} />
          </div>

          <blockquote className="reading-quote">“{quote.original_text}”</blockquote>
          {quote.translation_text ? <p className="reading-secondary">{quote.translation_text}</p> : null}

          <dl className="mt-8 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <div>
              <dt className="font-sans text-muted-foreground">作品</dt>
              <dd>
                {quote.work?.title ? <Link href={`/works/${quote.work.slug}`}>{quote.work.title}</Link> : "未关联作品"}
              </dd>
            </div>
            <div>
              <dt className="font-sans text-muted-foreground">作者</dt>
              <dd>{quote.author?.name ? <Link href={`/authors/${quote.author.slug}`}>{quote.author.name}</Link> : "未知作者"}</dd>
            </div>
            <div>
              <dt className="font-sans text-muted-foreground">语言</dt>
              <dd>{quote.original_language.toUpperCase()}</dd>
            </div>
            <div>
              <dt className="font-sans text-muted-foreground">核验状态</dt>
              <dd>
                {quote.verification_status === "VERIFIED"
                  ? "已核验"
                  : quote.verification_status === "PARTIALLY_VERIFIED"
                    ? "部分核验"
                    : "未核验"}
              </dd>
            </div>
            <div className="md:col-span-2">
              <dt className="font-sans text-muted-foreground">出处定位</dt>
              <dd>{quote.source_locator ?? "未提供"}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="font-sans text-muted-foreground">标签</dt>
              <dd className="mt-1 flex flex-wrap gap-2">
                {quote.quote_tags.map((item) => (
                  <Badge key={item.tag_id}>{formatTagLabel(item.tag.name)}</Badge>
                ))}
              </dd>
            </div>
          </dl>

          <div className="mt-8 space-y-3">
            <div className="flex flex-wrap gap-2">
              <SharePosterButton
                authorName={quote.author?.name ?? null}
                originalText={quote.original_text}
                translationText={quote.translation_text}
                workTitle={quote.work?.title ?? null}
              />
              <Link className={buttonVariants({ variant: "outline" })} href={`/submit?quoteId=${quote.id}`}>
                补充来源信息
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </article>
  );
}
