"use client";

import NextImage from "next/image";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

type SharePosterButtonProps = {
  originalText: string;
  translationText?: string | null;
  authorName?: string | null;
  workTitle?: string | null;
};

const POSTER_WIDTH = 1080;
const POSTER_MIN_HEIGHT = 980;

function escapeXml(input: string) {
  return input.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function measureTextWidth(text: string, font: string) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (ctx == null) {
    return text.length * 16;
  }
  ctx.font = font;
  return ctx.measureText(text).width;
}

function wrapLinesByWidth(text: string, maxWidth: number, font: string, maxLines: number) {
  const lines: string[] = [];
  const paragraphs = text.replaceAll("\r", "").split("\n");

  for (const paragraph of paragraphs) {
    if (lines.length >= maxLines) {
      break;
    }

    if (paragraph.length === 0) {
      lines.push("");
      continue;
    }

    const tokens = paragraph.split(/(\s+)/).filter((item) => item.length > 0);
    let current = "";

    for (const token of tokens) {
      const candidate = current + token;

      if (measureTextWidth(candidate, font) <= maxWidth) {
        current = candidate;
        continue;
      }

      if (current.trim().length > 0) {
        lines.push(current.trimEnd());
        if (lines.length >= maxLines) {
          return lines.slice(0, maxLines);
        }
        current = "";
      }

      if (measureTextWidth(token, font) <= maxWidth) {
        current = token.trimStart();
        continue;
      }

      // token 过长时按字符切分，避免横向溢出。
      let segment = "";
      for (const ch of token) {
        const nextSegment = segment + ch;
        if (measureTextWidth(nextSegment, font) <= maxWidth) {
          segment = nextSegment;
          continue;
        }
        if (segment.length > 0) {
          lines.push(segment);
          if (lines.length >= maxLines) {
            return lines.slice(0, maxLines);
          }
        }
        segment = ch;
      }
      current = segment;
    }

    if (current.length > 0) {
      lines.push(current.trimEnd());
    }
  }

  return lines.slice(0, maxLines);
}

function buildPosterSvg({
  originalText,
  translationText,
  authorName,
  workTitle,
}: Omit<SharePosterButtonProps, "quoteId">) {
  const originalLines = wrapLinesByWidth(originalText, 880, "54px serif", 120);
  const translationLines = translationText ? wrapLinesByWidth(translationText, 880, "36px serif", 120) : [];
  const sourceLine = [authorName, workTitle].filter(Boolean).join(" · ");

  const originalStartY = 230;
  const originalLineHeight = 70;
  const translationLineHeight = 50;
  const translationGap = 84;
  const sourceGap = 96;
  const dividerGap = 40;
  const footerGap = 60;
  const bottomPadding = 40;

  const originalLastY = originalStartY + Math.max(originalLines.length - 1, 0) * originalLineHeight;
  const translationStartY = originalLastY + translationGap;
  const translationLastY = translationStartY + Math.max(translationLines.length - 1, 0) * translationLineHeight;
  const sourceY = translationLines.length > 0 ? translationLastY + sourceGap : originalLastY + sourceGap;
  const dividerY = sourceY + dividerGap;
  const footerY = dividerY + footerGap;
  const posterHeight = Math.max(POSTER_MIN_HEIGHT, footerY + bottomPadding + 54);

  const originalTextSvg = originalLines
    .map((line, index) => `<tspan x="96" y="${originalStartY + index * originalLineHeight}">${escapeXml(line)}</tspan>`)
    .join("");

  const translationTextSvg = translationLines
    .map((line, index) => `<tspan x="96" y="${translationStartY + index * translationLineHeight}">${escapeXml(line)}</tspan>`)
    .join("");

  const sourceText = sourceLine.length > 0 ? sourceLine : "来源信息待补充";

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${POSTER_WIDTH}" height="${posterHeight}" viewBox="0 0 ${POSTER_WIDTH} ${posterHeight}">
  <rect width="100%" height="100%" fill="#f7f3ec"/>
  <rect x="54" y="54" width="${POSTER_WIDTH - 108}" height="${posterHeight - 108}" rx="22" fill="#fffdf9" stroke="#d9cec0" />
  <text x="96" y="140" font-family="serif" font-size="32" fill="#8a7762">SourceLines</text>
  <text x="96" y="200" font-family="serif" font-size="54" fill="#2e241a">${originalTextSvg}</text>
  ${
    translationLines.length > 0
      ? `<text x="96" y="${translationStartY - 40}" font-family="serif" font-size="36" fill="#5d4d3d">${translationTextSvg}</text>`
      : ""
  }
  <text x="96" y="${sourceY}" font-family="sans-serif" font-size="30" fill="#7f6d5a">${escapeXml(sourceText)}</text>
  <line x1="96" y1="${dividerY}" x2="${POSTER_WIDTH - 96}" y2="${dividerY}" stroke="#e6dbce" />
  <text x="96" y="${footerY}" font-family="sans-serif" font-size="24" fill="#9e8f81">Reading-first Quote Archive</text>
</svg>`;

  return { svg, height: posterHeight };
}

async function svgToPngBlob(svg: string, width: number, height: number) {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const image = new Image();
  image.src = url;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("POSTER_IMAGE_LOAD_FAILED"));
  });

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    URL.revokeObjectURL(url);
    throw new Error("POSTER_CANVAS_CONTEXT_MISSING");
  }

  context.drawImage(image, 0, 0, width, height);
  URL.revokeObjectURL(url);

  const pngBlob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((nextBlob) => resolve(nextBlob), "image/png");
  });

  if (!pngBlob) {
    throw new Error("POSTER_PNG_EXPORT_FAILED");
  }

  return pngBlob;
}

export function SharePosterButton(props: SharePosterButtonProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");

  const poster = useMemo(
    () =>
      buildPosterSvg({
        originalText: props.originalText,
        translationText: props.translationText,
        authorName: props.authorName,
        workTitle: props.workTitle,
      }),
    [props.authorName, props.originalText, props.translationText, props.workTitle],
  );

  const posterDataUrl = useMemo(
    () => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(poster.svg)}`,
    [poster.svg],
  );

  return (
    <div className="space-y-2">
      <Button onClick={() => setOpen((prev) => !prev)} type="button" variant="outline">
        {open ? "收起分享卡片" : "分享"}
      </Button>

      {open ? (
        <div className="space-y-3 rounded-md border bg-card p-3">
          <NextImage
            alt="引文分享海报预览"
            className="h-auto w-full rounded-md border"
            height={poster.height}
            src={posterDataUrl}
            unoptimized
            width={POSTER_WIDTH}
          />

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={async () => {
                try {
                  setStatus("正在生成 PNG...");
                  const pngBlob = await svgToPngBlob(poster.svg, POSTER_WIDTH, poster.height);
                  const objectUrl = URL.createObjectURL(pngBlob);
                  const anchor = document.createElement("a");
                  anchor.href = objectUrl;
                  anchor.download = "sourcelines-share.png";
                  anchor.click();
                  URL.revokeObjectURL(objectUrl);
                  setStatus("海报已开始下载。");
                } catch {
                  setStatus("下载失败，请稍后重试。");
                }
              }}
              type="button"
            >
              下载海报
            </Button>

            <Button
              onClick={async () => {
                try {
                  if (
                    typeof navigator === "undefined" ||
                    !("clipboard" in navigator) ||
                    typeof window.ClipboardItem === "undefined"
                  ) {
                    setStatus("当前浏览器不支持复制图片，请使用下载。");
                    return;
                  }
                  setStatus("正在复制图片...");
                  const pngBlob = await svgToPngBlob(poster.svg, POSTER_WIDTH, poster.height);
                  await navigator.clipboard.write([new window.ClipboardItem({ "image/png": pngBlob })]);
                  setStatus("海报已复制到剪贴板。");
                } catch {
                  setStatus("复制失败，请改用下载。");
                }
              }}
              type="button"
              variant="outline"
            >
              复制图片
            </Button>
          </div>

          {status ? <p className="text-xs text-muted-foreground">{status}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
