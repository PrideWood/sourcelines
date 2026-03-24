"use client";

import { useMemo, useState, useTransition } from "react";
import { tag_type } from "@prisma/client";

import { reorderTagsAction } from "@/app/admin/tags/actions";
import { Badge } from "@/components/ui/badge";

type TagItem = {
  id: string;
  name: string;
  tag_type: tag_type;
  sort_order: number;
};

const typeLabel: Record<tag_type, string> = {
  SOURCE: "来源类型",
  THEME: "主题",
  LEARNING: "学习难度",
  MOOD: "情绪",
};

function reorderInArray(items: TagItem[], from: number, to: number) {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function TagOrderManager({ tags, supportsSortOrder }: { tags: TagItem[]; supportsSortOrder: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [groups, setGroups] = useState<Record<tag_type, TagItem[]>>(() => ({
    SOURCE: tags.filter((item) => item.tag_type === "SOURCE"),
    THEME: tags.filter((item) => item.tag_type === "THEME"),
    LEARNING: tags.filter((item) => item.tag_type === "LEARNING"),
    MOOD: tags.filter((item) => item.tag_type === "MOOD"),
  }));

  const groupKeys = useMemo(() => (Object.keys(groups) as tag_type[]).filter((key) => groups[key].length > 0), [groups]);

  async function persistOrder(type: tag_type, ordered: TagItem[]) {
    if (!supportsSortOrder) {
      setMessage("当前数据库尚未应用标签排序迁移，请先执行 prisma migrate。");
      return;
    }
    const result = await reorderTagsAction({
      tagType: type,
      orderedIds: ordered.map((item) => item.id),
    });
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setMessage(result.message);
  }

  return (
    <div className="space-y-4">
      {groupKeys.map((group) => {
        const items = groups[group];
        return (
          <section className="space-y-2" key={group}>
            <p className="text-xs text-muted-foreground">{typeLabel[group]}</p>
            <div className="flex flex-wrap gap-2">
              {items.map((item, index) => (
                <button
                  className={`inline-flex cursor-grab items-center gap-1 rounded-full border px-3 py-1 text-sm ${draggingId === item.id ? "border-primary/50 bg-primary/10" : "border-border bg-background"}`}
                  draggable
                  key={item.id}
                  onDragEnd={() => {
                    setDraggingId(null);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                  }}
                  onDragStart={(event) => {
                    setDraggingId(item.id);
                    event.dataTransfer.setData("text/plain", JSON.stringify({ id: item.id, tagType: item.tag_type, fromIndex: index }));
                    event.dataTransfer.effectAllowed = "move";
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (!supportsSortOrder) {
                      setMessage("当前数据库尚未应用标签排序迁移，请先执行 prisma migrate。");
                      return;
                    }
                    try {
                      const raw = event.dataTransfer.getData("text/plain");
                      const payload = JSON.parse(raw) as { id: string; tagType: tag_type; fromIndex: number };
                      if (payload.tagType !== group) {
                        setMessage("当前仅支持同分类内排序。");
                        return;
                      }

                      const fromIndex = items.findIndex((i) => i.id === payload.id);
                      const toIndex = items.findIndex((i) => i.id === item.id);
                      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
                        return;
                      }

                      const reordered = reorderInArray(items, fromIndex, toIndex);
                      setGroups((prev) => ({ ...prev, [group]: reordered }));

                      startTransition(() => {
                        void persistOrder(group, reordered);
                      });
                    } catch {
                      setMessage("拖拽数据异常，请重试。");
                    }
                  }}
                  title="拖拽调整顺序"
                  type="button"
                >
                  <span className="text-xs text-muted-foreground">⋮⋮</span>
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </section>
        );
      })}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Badge>拖拽排序</Badge>
        <span>{isPending ? "保存中..." : message || "可在同分类内拖拽标签排序，顺序会自动保存。"}</span>
      </div>
    </div>
  );
}
