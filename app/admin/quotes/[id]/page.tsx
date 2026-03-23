import Link from "next/link";
import { difficulty_level, verification_status } from "@prisma/client";
import { notFound } from "next/navigation";

import { DeleteQuoteButton } from "@/components/admin/delete-quote-button";
import { updateQuoteAction, deleteQuoteAction } from "@/app/admin/quotes/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { prisma } from "@/lib/prisma";
import { getAdminQuoteById } from "@/lib/queries";

export const dynamic = "force-dynamic";

function getErrorMessage(error: string | undefined) {
  if (!error) return "";
  if (error === "missing_required") return "请填写原文与原文语言。";
  if (error === "invalid_verification") return "核验状态无效。";
  if (error === "invalid_difficulty") return "难度等级无效。";
  if (error === "foreign_key") return "作者、作品或语言关联无效，请检查后重试。";
  if (error === "delete_failed") return "删除失败，请稍后重试。";
  return "保存失败，请稍后重试。";
}

export default async function AdminQuoteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  const [quote, languages, authors, works, tags] = await Promise.all([
    getAdminQuoteById(id),
    prisma.language.findMany({
      where: { is_active: true },
      orderBy: { name_en: "asc" },
      select: { code: true, name_en: true, name_native: true },
    }),
    prisma.author.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.work.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
    prisma.tag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true }, take: 20 }),
  ]);

  if (!quote) {
    notFound();
  }

  const errorMessage = getErrorMessage(query.error);

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">编辑条目</h1>
        <p className="text-sm text-muted-foreground">Quote ID: {quote.id}</p>
      </header>

      {query.updated === "1" ? <p className="text-sm text-green-700">保存成功。</p> : null}
      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">编辑内容</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateQuoteAction} className="space-y-4">
            <input name="quote_id" type="hidden" value={quote.id} />

            <div className="space-y-2">
              <Label htmlFor="original_text">原文 *</Label>
              <Textarea defaultValue={quote.original_text} id="original_text" name="original_text" rows={5} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="translation_text">译文</Label>
              <Textarea defaultValue={quote.translation_text ?? ""} id="translation_text" name="translation_text" rows={4} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="original_language">原文语言 *</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  defaultValue={quote.original_language}
                  id="original_language"
                  name="original_language"
                >
                  {languages.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.name_en} ({item.name_native})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="source_locator">出处位置</Label>
                <Input defaultValue={quote.source_locator ?? ""} id="source_locator" name="source_locator" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="verification_status">核验状态</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  defaultValue={quote.verification_status}
                  id="verification_status"
                  name="verification_status"
                >
                  {Object.values(verification_status).map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty_level">难度等级</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  defaultValue={quote.difficulty_level}
                  id="difficulty_level"
                  name="difficulty_level"
                >
                  {Object.values(difficulty_level).map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="author_id">作者</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  defaultValue={quote.author_id ?? ""}
                  id="author_id"
                  name="author_id"
                >
                  <option value="">不关联</option>
                  {authors.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="work_id">作品</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  defaultValue={quote.work_id ?? ""}
                  id="work_id"
                  name="work_id"
                >
                  <option value="">不关联</option>
                  {works.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>标签（首版只读预留）</Label>
              <p className="text-sm text-muted-foreground">
                当前已关联：
                {quote.quote_tags.length > 0 ? quote.quote_tags.map((item) => item.tag.name).join("、") : "无"}
              </p>
              <p className="text-xs text-muted-foreground">可选标签总数（预览）：{tags.length}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button className="rounded-md border px-3 py-2 text-sm" type="submit">
                保存
              </button>
              <Link className="rounded-md border px-3 py-2 text-sm" href="/admin/quotes">
                返回列表
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">删除条目</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={deleteQuoteAction}>
            <input name="quote_id" type="hidden" value={quote.id} />
            <DeleteQuoteButton className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700" label="删除该条目" />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
