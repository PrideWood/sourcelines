type SharePreviewClientProps = {
  quoteId: string;
};

export function SharePreviewClient({ quoteId }: SharePreviewClientProps) {
  const posterUrl = `/quotes/${quoteId}/poster`;

  return (
    <div>
      <div className="overflow-hidden rounded-[1.75rem] bg-[#f7f3ec]/70 p-2 md:p-3">
        <img
          alt="引文分享海报预览"
          className="block h-auto w-full rounded-[1.35rem]"
          src={posterUrl}
          style={{ width: "100%", height: "auto" }}
        />
      </div>
    </div>
  );
}
