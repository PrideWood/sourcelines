import { PageHeaderSkeleton, QuoteListSkeleton } from "@/components/loading/page-skeletons";

export default function MyFavoritesLoading() {
  return (
    <div className="space-y-4">
      <PageHeaderSkeleton titleWidth="w-28" subtitleWidth="w-40" />
      <QuoteListSkeleton compact count={2} />
    </div>
  );
}
