import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PageHeaderSkeleton({
  titleWidth = "w-28",
  subtitleWidth = "w-64",
}: {
  titleWidth?: string;
  subtitleWidth?: string;
}) {
  return (
    <header className="space-y-2 sm:space-y-2.5">
      <Skeleton className={`h-8 ${titleWidth}`} />
      <Skeleton className={`h-4 ${subtitleWidth}`} />
    </header>
  );
}

export function ActionListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-28" />
      </CardHeader>
      <CardContent className="space-y-2">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton className="h-12 w-full" key={index} />
        ))}
      </CardContent>
    </Card>
  );
}

export function QuoteCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <Card className="border-border/80">
      <CardHeader className="space-y-3 pb-2 md:pb-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <Skeleton className="h-5 w-24" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-md md:h-9 md:w-9" />
            <Skeleton className="h-8 w-14 rounded-md" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className={`w-full ${compact ? "h-16" : "h-20"}`} />
        {!compact ? <Skeleton className="h-12 w-4/5" /> : null}
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
  );
}

export function QuoteListSkeleton({
  count = 3,
  compact = false,
}: {
  count?: number;
  compact?: boolean;
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <QuoteCardSkeleton compact={compact} key={index} />
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-72" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-36" />
      </CardContent>
    </Card>
  );
}
