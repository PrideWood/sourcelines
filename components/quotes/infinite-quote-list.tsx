"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { QuoteListSkeleton } from "@/components/loading/page-skeletons";
import { QuoteCard, type QuoteCardData } from "@/components/quotes/quote-card";

type InfiniteQuoteListProps = {
  initialItems: QuoteCardData[];
  initialHasMore: boolean;
  initialNextOffset: number;
  limit: number;
  params: {
    q?: string;
    language?: string;
    verification?: string;
    difficulty?: string;
    tag?: string;
    translated?: string;
  };
};

export function InfiniteQuoteList({
  initialItems,
  initialHasMore,
  initialNextOffset,
  limit,
  params,
}: InfiniteQuoteListProps) {
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextOffset, setNextOffset] = useState(initialNextOffset);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollYRef = useRef(0);
  const hasRestoredRef = useRef(false);

  const requestQuery = useMemo(() => {
    const next = new URLSearchParams();
    if (params.q) next.set("q", params.q);
    if (params.language) next.set("language", params.language);
    if (params.verification) next.set("verification", params.verification);
    if (params.difficulty) next.set("difficulty", params.difficulty);
    if (params.tag) next.set("tag", params.tag);
    if (params.translated) next.set("translated", params.translated);
    next.set("limit", String(limit));
    return next;
  }, [limit, params.difficulty, params.language, params.q, params.tag, params.translated, params.verification]);

  const storageKey = useMemo(() => `browse-list:${requestQuery.toString()}`, [requestQuery]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    scrollYRef.current = window.scrollY;

    try {
      const raw = window.sessionStorage.getItem(storageKey);
      if (!raw) {
        hasRestoredRef.current = true;
        return;
      }

      const parsed = JSON.parse(raw) as {
        items?: QuoteCardData[];
        hasMore?: boolean;
        nextOffset?: number;
        scrollY?: number;
        savedAt?: number;
      };

      const savedAt = parsed.savedAt ?? 0;
      const isExpired = Date.now() - savedAt > 15 * 60 * 1000;
      if (isExpired || !Array.isArray(parsed.items) || parsed.items.length < initialItems.length) {
        hasRestoredRef.current = true;
        return;
      }

      setItems(parsed.items);
      setHasMore(Boolean(parsed.hasMore));
      setNextOffset(typeof parsed.nextOffset === "number" ? parsed.nextOffset : initialNextOffset);

      window.requestAnimationFrame(() => {
        window.scrollTo({
          top: typeof parsed.scrollY === "number" ? parsed.scrollY : 0,
          behavior: "auto",
        });
      });
    } catch {
      // Ignore malformed session cache and continue with server-provided first page.
    } finally {
      hasRestoredRef.current = true;
    }
  }, [initialItems.length, initialNextOffset, storageKey]);

  useEffect(() => {
    if (typeof window === "undefined" || !hasRestoredRef.current) {
      return;
    }

    const persistState = () => {
      try {
        window.sessionStorage.setItem(
          storageKey,
          JSON.stringify({
            items,
            hasMore,
            nextOffset,
            scrollY: scrollYRef.current,
            savedAt: Date.now(),
          }),
        );
      } catch {
        // Ignore storage quota and private mode errors; browsing should still work.
      }
    };

    persistState();

    const handleScroll = () => {
      scrollYRef.current = window.scrollY;
    };

    const handlePageHide = () => {
      scrollYRef.current = window.scrollY;
      persistState();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pagehide", handlePageHide);
      handlePageHide();
    };
  }, [hasMore, items, nextOffset, storageKey]);

  useEffect(() => {
    if (!hasMore || isLoading) {
      return;
    }

    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) {
          return;
        }

        setIsLoading(true);
        setError("");

        const query = new URLSearchParams(requestQuery);
        query.set("offset", String(nextOffset));

        void fetch(`/api/browse/quotes?${query.toString()}`, {
          method: "GET",
          cache: "no-store",
        })
          .then(async (response) => {
            if (!response.ok) {
              throw new Error("FETCH_QUOTES_FAILED");
            }
            return response.json() as Promise<{
              items: QuoteCardData[];
              hasMore: boolean;
              nextOffset: number;
            }>;
          })
          .then((payload) => {
            setItems((prev) => [...prev, ...payload.items]);
            setHasMore(payload.hasMore);
            setNextOffset(payload.nextOffset);
          })
          .catch(() => {
            setError("加载更多失败，请继续下滑重试。");
          })
          .finally(() => {
            setIsLoading(false);
          });
      },
      {
        rootMargin: "240px 0px",
      },
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoading, nextOffset, requestQuery]);

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">没有找到符合条件的句子。</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((quote) => (
        <QuoteCard key={quote.id} quote={quote} />
      ))}

      {isLoading ? (
        <div className="pt-1">
          <QuoteListSkeleton compact count={2} />
        </div>
      ) : null}
      {error ? <p className="py-2 text-center text-sm text-muted-foreground">{error}</p> : null}
      {!hasMore && items.length > 0 ? <p className="py-2 text-center text-sm text-muted-foreground">已经到底了。</p> : null}
      <div aria-hidden="true" ref={sentinelRef} />
    </div>
  );
}
