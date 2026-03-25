import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FavoriteToggleButton } from "@/components/quotes/favorite-toggle-button";
import { formatTagLabel } from "@/lib/tag-display";

type QuoteCardData = {
  id: string;
  original_text: string;
  translation_text: string | null;
  original_language: string;
  source_locator?: string | null;
  verification_status?: "UNVERIFIED" | "PARTIALLY_VERIFIED" | "VERIFIED";
  author: { name: string } | null;
  work: { title: string } | null;
  quote_tags?: Array<{ tag: { name: string } }>;
  favorites?: Array<{ user_id: string }>;
};

export function QuoteCard({
  quote,
  showFavorite = true,
  uniformHeight = false,
}: {
  quote: QuoteCardData;
  showFavorite?: boolean;
  uniformHeight?: boolean;
}) {
  const isFavorited = Boolean(quote.favorites && quote.favorites.length > 0);
  const verificationLabel =
    quote.verification_status === "VERIFIED"
      ? "已核验"
      : quote.verification_status === "PARTIALLY_VERIFIED"
        ? "部分核验"
        : "未核验";

  return (
    <Card
      className={`quote-card group relative border-border/80 transition-colors hover:border-foreground/20 ${uniformHeight ? "flex flex-col overflow-hidden md:h-[25rem]" : ""}`}
    >
      <Link
        aria-label="查看引文详情"
        className="absolute inset-0 z-10 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        href={`/quotes/${quote.id}`}
      />
      <CardHeader className="relative z-20 pointer-events-none pb-2 md:pb-4">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="line-clamp-1 text-[0.95rem] leading-6 md:text-base">{quote.author?.name ?? "未知作者"}</CardTitle>
          <div className="flex items-center gap-2">
            {showFavorite ? (
              <div className="pointer-events-auto">
                <FavoriteToggleButton initialFavorited={isFavorited} quoteId={quote.id} />
              </div>
            ) : null}
            <Badge className="shrink-0">{quote.original_language.toUpperCase()}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className={`pointer-events-none relative z-20 ${uniformHeight ? "flex min-h-0 flex-1 flex-col" : ""}`}>
        <div className={uniformHeight ? "quote-text-region flex-1" : ""}>
          <blockquote className={`reading-quote ${uniformHeight ? "reading-quote-clamp" : ""}`}>“{quote.original_text}”</blockquote>
          {quote.translation_text ? (
            <p className={`reading-secondary ${uniformHeight ? "reading-secondary-clamp" : ""}`}>{quote.translation_text}</p>
          ) : null}
        </div>

        <div className={uniformHeight ? "quote-meta-region mt-3 space-y-1.5 md:mt-4 md:space-y-2" : "mt-3 space-y-1.5 md:mt-4 md:space-y-2"}>
          <div className={`quote-tag-row flex flex-wrap gap-2 ${uniformHeight ? "" : "min-h-0"}`}>
            {quote.quote_tags && quote.quote_tags.length > 0 ? (
              quote.quote_tags
                .slice(0, 3)
                .map((item, index) => (
                  <Badge className={index > 1 ? "hidden md:inline-flex" : ""} key={`${quote.id}-${item.tag.name}-${index}`}>
                    {formatTagLabel(item.tag.name)}
                  </Badge>
                ))
            ) : uniformHeight ? (
              <span className="invisible text-xs">标签占位</span>
            ) : null}
          </div>

          <div className="quote-meta-row flex items-center justify-between gap-3 text-[11px] text-muted-foreground md:text-xs">
            <span className="line-clamp-1">{quote.work?.title ?? "未关联作品"}</span>
            <span className="shrink-0">{verificationLabel}</span>
          </div>

          <p className="quote-source-row line-clamp-1 text-[11px] text-muted-foreground md:text-xs">出处：{quote.source_locator ?? "未提供"}</p>
        </div>
      </CardContent>
    </Card>
  );
}
