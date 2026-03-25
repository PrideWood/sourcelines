type SharePreviewClientProps = {
  quoteId: string;
};

export function SharePreviewClient({ quoteId }: SharePreviewClientProps) {
  const posterUrl = `/quotes/${quoteId}/poster`;

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-card p-3">
        <img
          alt="引文分享海报预览"
          className="h-auto w-full rounded-md border"
          src={posterUrl}
          style={{ width: "100%", height: "auto" }}
        />
      </div>
      <p className="text-sm text-muted-foreground">长按图片即可保存到本地，保存后可分享至微信、QQ 等应用。</p>
    </div>
  );
}
