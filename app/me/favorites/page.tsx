import { QuoteCard } from "@/components/quotes/quote-card";
import { getFavoritesByUserId } from "@/lib/queries";
import { requireAuth } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function MyFavoritesPage() {
  const session = await requireAuth();
  const favorites = await getFavoritesByUserId(session.user.id);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">我的收藏</h1>
      {favorites.length === 0 ? <p className="text-sm text-muted-foreground">你还没有收藏任何引文。</p> : null}
      {favorites.map((favorite) => (
        <QuoteCard key={favorite.quote_id} quote={favorite.quote} />
      ))}
    </div>
  );
}
