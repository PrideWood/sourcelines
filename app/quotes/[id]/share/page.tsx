import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { SharePreviewClient } from "@/components/quotes/share-preview-client";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSession } from "@/lib/auth/session";
import { getQuoteByIdForUser } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function QuoteSharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const quote = await getQuoteByIdForUser(id, session?.user.id ?? null);

  if (!quote) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-xl space-y-4 pb-4 md:pb-6">
      <header className="space-y-2">
        <Link className={buttonVariants({ variant: "ghost" })} href={`/quotes/${id}`}>
          <ChevronLeft className="h-4 w-4" />
          返回详情
        </Link>
        <h1 className="text-2xl font-semibold">分享预览</h1>
        <p className="text-sm text-muted-foreground">长按下方海报即可保存，保存后可在常用应用中发送。</p>
      </header>

      <Card>
        <CardContent className="space-y-4 p-4 md:p-6">
          <SharePreviewClient
            quoteId={quote.id}
          />
        </CardContent>
      </Card>
    </article>
  );
}
