import Link from "next/link";
import { redirect } from "next/navigation";

import { ReviewSubmitButtons } from "@/components/admin/review-submit-buttons";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { reviewSubmissionAction } from "@/app/admin/submissions/actions";
import { getAdminSubmissionById } from "@/lib/queries";
import { getPresignedGetUrl } from "@/lib/r2";

export const dynamic = "force-dynamic";

const moderationText = {
  PENDING: "待审核",
  APPROVED: "已通过",
  REVISION_REQUIRED: "待补充",
  REJECTED: "已拒绝",
} as const;

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

export default async function AdminSubmissionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  const submission = await getAdminSubmissionById(id);

  if (!submission) {
    redirect("/admin/submissions?error=not_found");
  }

  const evidenceImageUrlEntries = await Promise.all(
    submission.submission_evidences.map(async (evidence) => {
      if (!evidence.object_key) {
        return [evidence.id, null] as const;
      }
      try {
        const url = await getPresignedGetUrl({ objectKey: evidence.object_key, expiresInSeconds: 900 });
        return [evidence.id, url] as const;
      } catch {
        return [evidence.id, null] as const;
      }
    }),
  );
  const evidenceImageUrlMap = new Map(evidenceImageUrlEntries);

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">审核详情</h1>
        <p className="text-sm text-muted-foreground">提交时间：{formatDate(submission.created_at)}</p>
        <p className="text-sm text-muted-foreground">请求类型：{submission.published_quote_id ? "条目修改" : "新投稿"}</p>
      </header>

      {query.updated === "1" ? <p className="text-sm text-green-700">审核结果已保存。</p> : null}
      {query.error ? <p className="text-sm text-red-600">审核失败，请稍后重试。</p> : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">投稿内容</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-base leading-8">“{submission.original_text}”</p>
          {submission.translation_text ? <p className="text-muted-foreground">{submission.translation_text}</p> : null}

          <dl className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">状态</dt>
              <dd>{moderationText[submission.moderation_status]}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">语言</dt>
              <dd>
                {submission.original_language_ref.name_en} ({submission.original_language_ref.code.toUpperCase()})
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">作品名</dt>
              <dd>{submission.source_work_title ?? "未填写"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">来源标题</dt>
              <dd>{submission.source_title ?? "未填写"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">作者名</dt>
              <dd>{submission.source_author_name ?? "未填写"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">投稿人</dt>
              <dd>
                {submission.submitter.display_name} ({submission.submitter.email})
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">出处位置</dt>
              <dd>{submission.source_locator ?? "未填写"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">核验状态</dt>
              <dd>{verificationText[submission.verification_status]}</dd>
            </div>
          </dl>

          {submission.raw_note ? (
            <div>
              <p className="text-muted-foreground">投稿备注</p>
              <p>{submission.raw_note}</p>
            </div>
          ) : null}

          <div>
            <p className="text-muted-foreground">投稿标签</p>
            {submission.submission_tags.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-2">
                {submission.submission_tags.map((item) => (
                  <Badge key={item.tag.id}>{item.tag.name}</Badge>
                ))}
              </div>
            ) : (
              <p>未选择标签</p>
            )}
          </div>

          {submission.review_note ? (
            <div>
              <p className="text-muted-foreground">当前审核备注</p>
              <p>{submission.review_note}</p>
            </div>
          ) : null}

          {submission.published_quote_id ? (
            <p className="text-sm text-muted-foreground">
              已关联 quote：
              <Link className="underline-offset-4 hover:underline" href={`/quotes/${submission.published_quote_id}`}>
                {submission.published_quote_id}
              </Link>
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">证据</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {submission.submission_evidences.length === 0 ? <p className="text-muted-foreground">暂无证据。</p> : null}

          {submission.submission_evidences.map((evidence) => (
            <div className="rounded-md border p-3" key={evidence.id}>
              <p>类型：{evidence.evidence_type}</p>
              {evidence.title ? <p>标题：{evidence.title}</p> : null}
              {evidence.filename ? (
                <p>
                  文件：{evidence.filename}
                  {evidence.file_size ? ` (${Math.round(evidence.file_size / 1024)} KB)` : ""}
                </p>
              ) : null}
              {evidence.object_key ? <p className="text-xs text-muted-foreground">对象键：{evidence.object_key}</p> : null}
              {evidence.object_key && evidenceImageUrlMap.get(evidence.id) ? (
                <div className="mt-2 space-y-2">
                  <a className="inline-block underline-offset-4 hover:underline" href={evidenceImageUrlMap.get(evidence.id)!} rel="noreferrer" target="_blank">
                    查看原图
                  </a>
                  <img
                    alt={evidence.filename ?? "证据图片"}
                    className="h-auto max-h-56 w-auto rounded-md border"
                    src={evidenceImageUrlMap.get(evidence.id)!}
                  />
                </div>
              ) : null}
              {evidence.url ? (
                <p>
                  链接：
                  <a className="underline-offset-4 hover:underline" href={evidence.url} rel="noreferrer" target="_blank">
                    {evidence.url}
                  </a>
                </p>
              ) : null}
              {evidence.note ? <p>备注：{evidence.note}</p> : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">审核操作</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form action={reviewSubmissionAction} className="space-y-3">
            <input name="submission_id" type="hidden" value={submission.id} />

            <div className="space-y-2">
              <Label htmlFor="review_note">审核备注（可选）</Label>
              <Textarea
                defaultValue={submission.review_note ?? ""}
                id="review_note"
                name="review_note"
                placeholder="例如：通过原因、退回需补充项、拒绝理由"
                rows={4}
              />
            </div>

            <ReviewSubmitButtons />
          </form>
        </CardContent>
      </Card>

      <Link className="text-sm underline-offset-4 hover:underline" href="/admin/submissions">
        返回审核列表
      </Link>
    </div>
  );
}
