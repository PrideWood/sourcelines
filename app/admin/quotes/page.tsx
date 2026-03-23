import Link from "next/link";
import { verification_status } from "@prisma/client";

import { DeleteQuoteButton } from "@/components/admin/delete-quote-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteQuoteAction } from "@/app/admin/quotes/actions";
import { prisma } from "@/lib/prisma";
import { getAdminQuotes } from "@/lib/queries";

export const dynamic = "force-dynamic";

const verificationText = {
  UNVERIFIED: "未核验",
  PARTIALLY_VERIFIED: "部分核验",
  VERIFIED: "已核验",
} as const;

function formatDate(input: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(input);
}

export default async function AdminQuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ verification?: string; language?: string; deleted?: string; error?: string }>;
}) {
  const params = await searchParams;
  const verification = Object.values(verification_status).includes(params.verification as verification_status)
    ? (params.verification as verification_status)
    : undefined;
  const language = params.language?.trim() || undefined;

  const [quotes, languages] = await Promise.all([
    getAdminQuotes({ verificationStatus: verification, language }),
    prisma.language.findMany({
      where: { is_active: true },
      orderBy: { name_en: "asc" },
      select: {
        code: true,
        name_en: true,
      },
    }),
  ]);

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">管理条目</h1>
        <p className="text-sm text-muted-foreground">维护已发布的正式引文内容。</p>
      </header>

      {params.deleted === "1" ? <p className="text-sm text-green-700">条目已删除。</p> : null}
      {params.error ? <p className="text-sm text-red-600">操作失败，请稍后重试。</p> : null}

      <Card>
        <CardContent className="pt-6">
          <form className="grid gap-3 md:grid-cols-3" method="get">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="verification">
                核验状态
              </label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                defaultValue={verification ?? ""}
                id="verification"
                name="verification"
              >
                <option value="">全部</option>
                <option value="UNVERIFIED">未核验</option>
                <option value="PARTIALLY_VERIFIED">部分核验</option>
                <option value="VERIFIED">已核验</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="language">
                语言
              </label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                defaultValue={language ?? ""}
                id="language"
                name="language"
              >
                <option value="">全部</option>
                {languages.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name_en} ({item.code.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button className="rounded-md border px-3 py-2 text-sm" type="submit">
                筛选
              </button>
              <Link className="rounded-md border px-3 py-2 text-sm" href="/admin/quotes">
                重置
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {quotes.length === 0 ? <p className="text-sm text-muted-foreground">当前没有可管理的条目。</p> : null}

      {quotes.map((quote) => (
        <Card key={quote.id}>
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">{quote.author?.name ?? "未知作者"}</CardTitle>
              <Badge>{verificationText[quote.verification_status]}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="line-clamp-2">“{quote.original_text}”</p>

            <dl className="grid grid-cols-1 gap-2 text-muted-foreground md:grid-cols-3">
              <div>
                <dt>语言</dt>
                <dd className="text-foreground">
                  {quote.original_language_ref.name_en} ({quote.original_language.toUpperCase()})
                </dd>
              </div>
              <div>
                <dt>作者</dt>
                <dd className="text-foreground">{quote.author?.name ?? "未关联"}</dd>
              </div>
              <div>
                <dt>作品</dt>
                <dd className="text-foreground">{quote.work?.title ?? "未关联"}</dd>
              </div>
              <div>
                <dt>创建时间</dt>
                <dd className="text-foreground">{formatDate(quote.created_at)}</dd>
              </div>
              <div>
                <dt>核验状态</dt>
                <dd className="text-foreground">{verificationText[quote.verification_status]}</dd>
              </div>
            </dl>

            <div className="flex flex-wrap gap-2">
              <Link className="rounded-md border px-3 py-1 text-sm" href={`/admin/quotes/${quote.id}`}>
                编辑
              </Link>

              <form action={deleteQuoteAction}>
                <input name="quote_id" type="hidden" value={quote.id} />
                <DeleteQuoteButton className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-700" />
              </form>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
