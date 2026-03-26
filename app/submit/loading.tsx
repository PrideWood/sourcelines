import { FormSkeleton, PageHeaderSkeleton } from "@/components/loading/page-skeletons";

export default function SubmitLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeaderSkeleton titleWidth="w-28" subtitleWidth="w-80" />
      <FormSkeleton />
    </div>
  );
}
