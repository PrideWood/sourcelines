import Link from "next/link";
import { notFound } from "next/navigation";

import { QuoteCard } from "@/components/quotes/quote-card";
import { Card, CardContent } from "@/components/ui/card";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AuthorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getSession();

  const author = await prisma.author.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      bio: true,
      works: {
        select: { id: true, slug: true, title: true },
        orderBy: { title: "asc" },
      },
    },
  });

  if (!author) {
    notFound();
  }

  const quotes = await prisma.quote.findMany({
    where: { author_id: author.id },
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
        <h1 className="text-2xl font-semibold">作者：{author.name}</h1>
        <p className="text-sm text-muted-foreground">辅助聚合页：聚焦该作者相关句子。</p>
        {author.bio ? <p className="text-sm text-muted-foreground">{author.bio}</p> : null}
      </header>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">关联作品（{author.works.length}）</p>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            {author.works.length === 0 ? <span className="text-muted-foreground">暂无</span> : null}
            {author.works.map((work) => (
              <Link className="underline-offset-4 hover:underline" href={`/works/${work.slug}`} key={work.id}>
                {work.title}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">该作者句子</h2>
        {quotes.length === 0 ? <p className="text-sm text-muted-foreground">暂无关联句子。</p> : null}
        {quotes.map((quote) => (
          <QuoteCard key={quote.id} quote={quote} />
        ))}
      </section>
    </div>
  );
}
