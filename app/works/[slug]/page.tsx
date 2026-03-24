import Link from "next/link";
import { notFound } from "next/navigation";

import { QuoteCard } from "@/components/quotes/quote-card";
import { Card, CardContent } from "@/components/ui/card";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function WorkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getSession();

  const work = await prisma.work.findUnique({
    where: { slug },
    include: {
      author: {
        select: { slug: true, name: true },
      },
      language: {
        select: { code: true, name_en: true },
      },
    },
  });

  if (!work) {
    notFound();
  }

  const quotes = await prisma.quote.findMany({
    where: { work_id: work.id },
    orderBy: { created_at: "desc" },
    include: {
      author: true,
      work: true,
      ...(session
        ? {
            favorites: {
              where: { user_id: session.user.id },
              select: { user_id: true },
            },
          }
        : {}),
      quote_tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">作品：{work.title}</h1>
        <p className="text-sm text-muted-foreground">辅助聚合页：聚焦该作品相关句子。</p>
      </header>

      <Card>
        <CardContent className="pt-6 text-sm">
          <p>
            作者：
            {work.author ? (
              <Link className="underline-offset-4 hover:underline" href={`/authors/${work.author.slug}`}>
                {work.author.name}
              </Link>
            ) : (
              <span className="text-muted-foreground">未知</span>
            )}
          </p>
          <p className="mt-1 text-muted-foreground">语言：{work.language ? `${work.language.name_en} (${work.language.code.toUpperCase()})` : "未标注"}</p>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">该作品句子</h2>
        {quotes.length === 0 ? <p className="text-sm text-muted-foreground">暂无关联句子。</p> : null}
        {quotes.map((quote) => (
          <QuoteCard key={quote.id} quote={quote} />
        ))}
      </section>
    </div>
  );
}
