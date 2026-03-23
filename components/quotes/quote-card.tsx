import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FavoriteToggleButton } from "@/components/quotes/favorite-toggle-button";

type QuoteCardData = {
  id: string;
  original_text: string;
  translation_text: string | null;
  original_language: string;
  author: { name: string } | null;
  work: { title: string } | null;
  quote_tags?: Array<{ tag: { name: string } }>;
  favorites?: Array<{ user_id: string }>;
};

export function QuoteCard({
  quote,
  showFavorite = true,
}: {
  quote: QuoteCardData;
  showFavorite?: boolean;
}) {
  const isFavorited = Boolean(quote.favorites && quote.favorites.length > 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">{quote.author?.name ?? "未知作者"}</CardTitle>
          <Badge>{quote.original_language.toUpperCase()}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <blockquote className="reading-quote">“{quote.original_text}”</blockquote>
        {quote.translation_text ? <p className="reading-secondary">{quote.translation_text}</p> : null}

        {quote.quote_tags && quote.quote_tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {quote.quote_tags.slice(0, 3).map((item, index) => (
              <Badge key={`${quote.id}-${item.tag.name}-${index}`}>{item.tag.name}</Badge>
            ))}
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>{quote.work?.title ?? "未关联作品"}</span>
          <Link className="underline-offset-4 hover:underline" href={`/quotes/${quote.id}`}>
            查看详情
          </Link>
        </div>

        {showFavorite ? (
          <div className="mt-4">
            <FavoriteToggleButton initialFavorited={isFavorited} quoteId={quote.id} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
