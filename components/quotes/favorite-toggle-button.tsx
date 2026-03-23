"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

import { toggleFavoriteAction } from "@/app/actions/favorites";
import { cn } from "@/lib/utils";

export function FavoriteToggleButton({
  quoteId,
  initialFavorited,
}: {
  quoteId: string;
  initialFavorited: boolean;
}) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  const label = useMemo(() => {
    if (isPending) return "处理中...";
    return isFavorited ? "已收藏" : "收藏";
  }, [isFavorited, isPending]);

  return (
    <div className="space-y-1">
      <button
        className={cn(
          "rounded-md border px-3 py-1 text-sm transition-colors",
          isFavorited
            ? "border-primary bg-primary/10 text-primary"
            : "border-border bg-background hover:bg-accent hover:text-accent-foreground",
          isPending && "cursor-not-allowed opacity-70",
        )}
        disabled={isPending}
        onClick={() => {
          setFeedback("");
          const previous = isFavorited;
          const optimistic = !previous;
          setIsFavorited(optimistic);

          startTransition(async () => {
            const result = await toggleFavoriteAction(quoteId, pathname || "/quotes");

            if (result.redirectTo) {
              router.push(result.redirectTo);
              setIsFavorited(previous);
              return;
            }

            setIsFavorited(result.favorited);
            setFeedback(result.message ?? (result.favorited ? "已加入收藏" : "已取消收藏"));
            router.refresh();
          });
        }}
        type="button"
      >
        {label}
      </button>
      {feedback ? <p className="text-xs text-muted-foreground">{feedback}</p> : null}
    </div>
  );
}
