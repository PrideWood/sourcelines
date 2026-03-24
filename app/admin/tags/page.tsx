import { tag_type } from "@prisma/client";

import { createTagAction, updateTagAction } from "@/app/admin/tags/actions";
import { TagOrderManager } from "@/components/admin/tag-order-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { prisma } from "@/lib/prisma";
import { ensureTagSortOrderColumn, hasTagSortOrderColumn } from "@/lib/tag-sort-order";

export const dynamic = "force-dynamic";

const typeLabel: Record<tag_type, string> = {
  SOURCE: "来源类型",
  THEME: "主题",
  LEARNING: "学习难度",
  MOOD: "情绪",
};

function getMessage(params: { error?: string; created?: string; updated?: string; initialized?: string; added?: string; skipped?: string }) {
  if (params.initialized === "1") {
    const added = Number(params.added ?? "0");
    const skipped = Number(params.skipped ?? "0");
    return {
      text: `默认标签初始化完成。新增 ${Number.isFinite(added) ? added : 0} 个，跳过 ${Number.isFinite(skipped) ? skipped : 0} 个。`,
      tone: "ok" as const,
    };
  }
  if (params.created === "1") return { text: "标签已创建。", tone: "ok" as const };
  if (params.updated === "1") return { text: "标签已更新。", tone: "ok" as const };
  if (!params.error) return null;
  return { text: "操作失败，请检查名称、slug、父标签后重试。", tone: "error" as const };
}

export default async function AdminTagsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string; updated?: string; initialized?: string; added?: string; skipped?: string }>;
}) {
  const params = await searchParams;
  const message = getMessage(params);
  const supportsSortOrder = (await ensureTagSortOrderColumn()) || (await hasTagSortOrderColumn());

  const tags = await prisma.tag.findMany({
    orderBy: [{ tag_type: "asc" }, { name: "asc" }],
    include: {
      parent: {
        select: { id: true, name: true },
      },
    },
  });
  let sortMap = new Map<string, number>();
  if (supportsSortOrder) {
    const sortRows = await prisma.$queryRaw<Array<{ id: string; sort_order: number }>>`
      SELECT id, sort_order
      FROM tags
    `;
    sortMap = new Map(sortRows.map((row) => [row.id, Number(row.sort_order ?? 0)]));
    tags.sort((a, b) => {
      if (a.tag_type !== b.tag_type) {
        return String(a.tag_type).localeCompare(String(b.tag_type));
      }
      const aSort = sortMap.get(a.id) ?? 0;
      const bSort = sortMap.get(b.id) ?? 0;
      if (aSort !== bSort) {
        return aSort - bSort;
      }
      return a.name.localeCompare(b.name);
    });
  }

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">标签管理</h1>
        <p className="text-sm text-muted-foreground">首版支持查看、新增、编辑。删除暂不开放，避免误删已有引用。</p>
      </header>

      {message ? <p className={`text-sm ${message.tone === "ok" ? "text-green-700" : "text-red-600"}`}>{message.text}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">分组标签排序</CardTitle>
        </CardHeader>
        <CardContent>
          <TagOrderManager
            tags={tags.map((tag) => ({
              id: tag.id,
              name: tag.name,
              tag_type: tag.tag_type,
              sort_order: sortMap.get(tag.id) ?? 0,
            }))}
            supportsSortOrder={supportsSortOrder}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">新增标签</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTagAction} className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="name">名称 *</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="slug">Slug（可选，留空将自动生成）</Label>
              <Input id="slug" name="slug" placeholder="theme-love" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tag_type">类型 *</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" id="tag_type" name="tag_type">
                {Object.values(tag_type).map((item) => (
                  <option key={item} value={item}>
                    {item}（{typeLabel[item]}）
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="parent_id">父标签（可选）</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" id="parent_id" name="parent_id">
                <option value="">无</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="description">说明（可选）</Label>
              <Textarea id="description" name="description" rows={2} />
            </div>
            <div>
              <button className="rounded-md border px-3 py-2 text-sm" type="submit">
                新增标签
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      <details className="rounded-md border p-4">
        <summary className="cursor-pointer text-sm font-medium">展开逐条编辑（高级）</summary>
        <div className="mt-4 space-y-3">
          {tags.map((tag) => (
            <Card key={tag.id}>
              <CardContent className="pt-6">
                <form action={updateTagAction} className="grid gap-3 md:grid-cols-2">
                  <input name="id" type="hidden" value={tag.id} />
                  <div className="space-y-1">
                    <Label htmlFor={`name-${tag.id}`}>名称</Label>
                    <Input defaultValue={tag.name} id={`name-${tag.id}`} name="name" required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`slug-${tag.id}`}>Slug</Label>
                    <Input defaultValue={tag.slug} id={`slug-${tag.id}`} name="slug" required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`type-${tag.id}`}>类型</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      defaultValue={tag.tag_type}
                      id={`type-${tag.id}`}
                      name="tag_type"
                    >
                      {Object.values(tag_type).map((item) => (
                        <option key={item} value={item}>
                          {item}（{typeLabel[item]}）
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`parent-${tag.id}`}>父标签</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      defaultValue={tag.parent_id ?? ""}
                      id={`parent-${tag.id}`}
                      name="parent_id"
                    >
                      <option value="">无</option>
                      {tags
                        .filter((item) => item.id !== tag.id)
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor={`description-${tag.id}`}>说明</Label>
                    <Textarea defaultValue={tag.description ?? ""} id={`description-${tag.id}`} name="description" rows={2} />
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground md:col-span-2">
                    <span>slug: {tag.slug}</span>
                    <span>parent: {tag.parent?.name ?? "无"}</span>
                    <span>sort: {supportsSortOrder ? String(sortMap.get(tag.id) ?? "-") : "-"}</span>
                  </div>
                  <div>
                    <button className="rounded-md border px-3 py-2 text-sm" type="submit">
                      保存修改
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      </details>
    </div>
  );
}
