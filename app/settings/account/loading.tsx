import { ActionListSkeleton, PageHeaderSkeleton } from "@/components/loading/page-skeletons";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AccountSettingsLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeaderSkeleton titleWidth="w-28" subtitleWidth="w-72" />

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-56" />
        </CardContent>
      </Card>

      <ActionListSkeleton rows={3} />
    </div>
  );
}
