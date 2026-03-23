import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/session";
import { getSubmissionsByUserId } from "@/lib/queries";

export const dynamic = "force-dynamic";

const moderationLabel = {
  PENDING: "待审核",
  APPROVED: "已通过",
  REVISION_REQUIRED: "待补充",
  REJECTED: "需补充",
} as const;

const verificationLabel = {
  UNVERIFIED: "未核验",
  PARTIALLY_VERIFIED: "部分核验",
  VERIFIED: "已核验",
} as const;

export default async function MySubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const params = await searchParams;
  const session = await requireAuth();
  const submissions = await getSubmissionsByUserId(session.user.id);

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">我的投稿</h1>
        <p className="text-sm text-muted-foreground">这里只显示你提交过的原始投稿及审核状态。</p>
      </header>

      {params.submitted === "1" ? (
        <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">投稿已提交，正在等待审核。</p>
      ) : null}

      {submissions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">还没有投稿记录</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">你可以先提交一条引文，系统会进入审核流程。</p>
            <Link className="text-sm underline-offset-4 hover:underline" href="/submit">
              前往投稿
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {submissions.map((item) => (
        <Card key={item.id}>
          <CardHeader className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{moderationLabel[item.moderation_status]}</Badge>
              <Badge className="border-border/80">{verificationLabel[item.verification_status]}</Badge>
              <Badge className="bg-muted/50">证据 {item._count.submission_evidences}</Badge>
            </div>
            <CardTitle className="text-base">{item.source_work_title ?? "未填写作品"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <blockquote className="line-clamp-3 text-base leading-7 text-foreground/90">“{item.original_text}”</blockquote>

            {item.translation_text ? <p className="line-clamp-2 text-sm text-muted-foreground">{item.translation_text}</p> : null}

            <dl className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">语言</dt>
                <dd>{item.original_language_ref.name_en} ({item.original_language_ref.code.toUpperCase()})</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">作者</dt>
                <dd>{item.source_author_name ?? "未填写"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">出处</dt>
                <dd>{item.source_locator ?? "未填写"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">体裁</dt>
                <dd>{item.genre_type ?? "未填写"}</dd>
              </div>
            </dl>

            {item.review_note ? (
              <div className="rounded-md border bg-muted/20 p-3 text-sm">
                <p className="font-medium">审核备注</p>
                <p className="mt-1 text-muted-foreground">{item.review_note}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
