import { PageHeaderSkeleton } from "@/components/loading/page-skeletons";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function QuoteDetailLoading() {
  return (
    <article className="mx-auto max-w-3xl space-y-6 sm:space-y-7 md:space-y-8">
      <PageHeaderSkeleton titleWidth="w-24" subtitleWidth="w-48" />

      <Card>
        <CardContent className="space-y-4 pt-6 sm:space-y-5 sm:pt-7 md:pt-8">
          <Skeleton className="h-24 w-full sm:h-28" />
          <Skeleton className="h-16 w-4/5 sm:h-20" />
          <div className="mt-8 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full md:col-span-2" />
            <Skeleton className="h-16 w-full md:col-span-2" />
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
        </CardContent>
      </Card>
    </article>
  );
}
