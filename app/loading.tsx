import { PageHeaderSkeleton, QuoteListSkeleton } from "@/components/loading/page-skeletons";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="space-y-5">
      <div className="md:hidden space-y-5">
        <PageHeaderSkeleton titleWidth="w-36" subtitleWidth="w-52" />
        <Card>
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-14 w-5/6" />
            <Skeleton className="h-11 w-full" />
          </CardContent>
        </Card>
      </div>

      <div className="hidden space-y-6 md:block">
        <PageHeaderSkeleton titleWidth="w-64" subtitleWidth="w-80" />
        <QuoteListSkeleton compact count={3} />
      </div>
    </div>
  );
}
