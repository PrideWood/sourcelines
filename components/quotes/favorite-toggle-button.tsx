"use client";

import { Star } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

import { toggleFavoriteAction } from "@/app/actions/favorites";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FavoriteToggleButton({
  quoteId,
  initialFavorited,
  withLabel = false,
}: {
  quoteId: string;
  initialFavorited: boolean;
  withLabel?: boolean;
}) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();

  const ariaLabel = useMemo(() => {
    if (isPending) return "收藏处理中";
    return isFavorited ? "取消收藏" : "收藏句子";
  }, [isFavorited, isPending]);

  const title = useMemo(() => {
    if (isPending) return "处理中...";
    return isFavorited ? "已收藏，点击取消" : "点击收藏";
  }, [isFavorited, isPending]);

  return (
    <button
      aria-label={ariaLabel}
      className={cn(
        withLabel
          ? buttonVariants({ variant: "outline" })
          : "inline-flex h-10 w-10 items-center justify-center rounded-md transition-colors md:h-9 md:w-9",
        withLabel ? "gap-2" : "",
        isFavorited ? "text-yellow-500" : "text-muted-foreground hover:text-accent-foreground",
        isPending && "cursor-not-allowed opacity-70",
      )}
      disabled={isPending}
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.stopPropagation();

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
          router.refresh();
        });
      }}
      title={title}
      type="button"
    >
      <Star
        className="h-4 w-4"
        fill={isFavorited ? "currentColor" : "none"}
        strokeWidth={2}
      />
      {withLabel ? <span>{isPending ? "收藏中" : "收藏"}</span> : null}
    </button>
  );
}
