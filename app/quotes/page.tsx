import { QuoteCard } from "@/components/quotes/quote-card";
import { getSession } from "@/lib/auth/session";
import { getQuotesListForUser } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function QuotesPage() {
  const session = await getSession();
  const quotes = await getQuotesListForUser(session?.user.id ?? null);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">引文列表</h1>
        <p className="text-muted-foreground">按语言、来源与标签持续扩展的标准化引文库。</p>
      </header>

      <div className="space-y-4">
        {quotes.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无引文数据，请检查数据库连接或先执行 seed。</p>
        ) : null}
        {quotes.map((quote) => (
          <QuoteCard key={quote.id} quote={quote} />
        ))}
      </div>
    </div>
  );
}
