import { PageHeaderSkeleton, QuoteListSkeleton } from "@/components/loading/page-skeletons";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function BrowseLoading() {
  return (
    <div className="space-y-5 sm:space-y-6 md:space-y-7">
      <PageHeaderSkeleton titleWidth="w-20" subtitleWidth="w-56" />

      <Card>
        <CardContent className="space-y-4 pt-5 sm:space-y-5 sm:pt-6 md:pt-7">
          <Skeleton className="h-11 w-full" />
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-16 rounded-full" />
            </div>
            <Skeleton className="h-10 w-full md:hidden" />
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3 sm:space-y-4 md:space-y-5">
        <Skeleton className="h-6 w-16" />
        <QuoteListSkeleton count={4} />
      </section>
    </div>
  );
}
