import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";

import { getQuoteById } from "@/lib/queries";

export const runtime = "nodejs";

function estimateLineCount(text: string, charsPerLine: number) {
  if (text.trim().length === 0) return 1;
  const paragraphs = text.replace(/\r/g, "").split("\n");
  let lines = 0;
  for (const paragraph of paragraphs) {
    const count = Math.max(1, Math.ceil(paragraph.length / charsPerLine));
    lines += count;
  }
  return lines;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const quote = await getQuoteById(id);
  if (!quote) {
    notFound();
  }

  const original = quote.original_text ?? "";
  const translation = quote.translation_text ?? "";
  const sourceLine = [quote.author?.name, quote.work?.title].filter(Boolean).join(" · ") || "来源信息待补充";

  const originalLines = estimateLineCount(original, 22);
  const translationLines = translation ? estimateLineCount(translation, 28) : 0;
  const height = Math.max(980, 380 + originalLines * 52 + translationLines * 44 + 220);

  return new ImageResponse(
    (
      <div
        style={{
          width: "1080px",
          height: `${height}px`,
          display: "flex",
          background: "#f7f3ec",
          padding: "54px",
          color: "#2e241a",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            borderRadius: "22px",
            border: "1px solid #d9cec0",
            background: "#fffdf9",
            padding: "54px 42px",
          }}
        >
          <div style={{ fontSize: 32, color: "#8a7762", marginBottom: 44 }}>SourceLines</div>
          <div
            style={{
              whiteSpace: "pre-wrap",
              fontSize: 54,
              lineHeight: 1.35,
              letterSpacing: "0.01em",
              color: "#2e241a",
            }}
          >
            {original}
          </div>
          {translation ? (
            <div
              style={{
                whiteSpace: "pre-wrap",
                fontSize: 36,
                lineHeight: 1.4,
                color: "#5d4d3d",
                marginTop: 54,
              }}
            >
              {translation}
            </div>
          ) : null}
          <div
            style={{
              marginTop: 64,
              fontSize: 30,
              color: "#7f6d5a",
              lineHeight: 1.35,
              whiteSpace: "pre-wrap",
            }}
          >
            {sourceLine}
          </div>
          <div style={{ marginTop: 34, height: 1, width: "100%", background: "#e6dbce" }} />
          <div style={{ marginTop: 36, fontSize: 24, color: "#9e8f81", fontFamily: "sans-serif" }}>
            Reading-first Quote Archive
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height,
    },
  );
}
