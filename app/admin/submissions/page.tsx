import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminSubmissionQueue } from "@/lib/queries";

export const dynamic = "force-dynamic";

const moderationText = {
  PENDING: "待审核",
  APPROVED: "已通过",
  REVISION_REQUIRED: "待补充",
  REJECTED: "已拒绝",
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

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const submissions = await getAdminSubmissionQueue();

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">审核投稿</h1>
        <p className="text-sm text-muted-foreground">管理员手工审核投稿，确认后可生成正式引文。</p>
      </header>

      {params.error ? <p className="text-sm text-red-600">请求无效或投稿不存在，请刷新后重试。</p> : null}

      {submissions.length === 0 ? <p className="text-sm text-muted-foreground">暂无投稿记录。</p> : null}

      {submissions.map((item) => (
        <Card key={item.id}>
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">{item.source_work_title ?? item.source_title ?? "未填写来源标题"}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge>{item.published_quote_id ? "条目修改" : "新投稿"}</Badge>
                <Badge>{moderationText[item.moderation_status]}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="line-clamp-2">“{item.original_text}”</p>

            <dl className="grid grid-cols-1 gap-2 text-muted-foreground md:grid-cols-2">
              <div>
                <dt>语言</dt>
                <dd className="text-foreground">
                  {item.original_language_ref.name_en} ({item.original_language_ref.code.toUpperCase()})
                </dd>
              </div>
              <div>
                <dt>投稿人</dt>
                <dd className="text-foreground">{item.submitter.display_name}</dd>
              </div>
              <div>
                <dt>提交时间</dt>
                <dd className="text-foreground">{formatDate(item.created_at)}</dd>
              </div>
              <div>
                <dt>当前状态</dt>
                <dd className="text-foreground">{moderationText[item.moderation_status]}</dd>
              </div>
            </dl>

            <Link className="text-sm underline-offset-4 hover:underline" href={`/admin/submissions/${item.id}`}>
              查看投稿详情
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
