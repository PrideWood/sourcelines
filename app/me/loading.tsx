import { ActionListSkeleton, PageHeaderSkeleton } from "@/components/loading/page-skeletons";

export default function MeLoading() {
  return (
    <div className="mx-auto max-w-md space-y-4">
      <PageHeaderSkeleton titleWidth="w-20" subtitleWidth="w-56" />
      <ActionListSkeleton />
    </div>
  );
}
