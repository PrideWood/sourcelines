import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";

import { getQuoteById } from "@/lib/queries";

export const runtime = "nodejs";
const NOTO_SERIF_SC_FILES = [
  join(process.cwd(), "node_modules/@fontsource/noto-serif-sc/files/noto-serif-sc-chinese-simplified-400-normal.woff"),
  join(process.cwd(), "node_modules/@fontsource/noto-serif-sc/files/noto-serif-sc-latin-400-normal.woff"),
  join(process.cwd(), "node_modules/@fontsource/noto-serif-sc/files/noto-serif-sc-latin-ext-400-normal.woff"),
] as const;

const POSTER_FONT_CANDIDATES = [
  "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
  "/Library/Fonts/Arial Unicode.ttf",
] as const;

let posterFontDataPromise: Promise<ArrayBuffer | null> | null = null;
let notoSerifPosterFontsPromise: Promise<Array<{ name: string; data: ArrayBuffer; style: "normal"; weight: 400 }> | []> | null = null;

async function loadNotoSerifPosterFonts() {
  if (notoSerifPosterFontsPromise) {
    return notoSerifPosterFontsPromise;
  }

  notoSerifPosterFontsPromise = (async () => {
    try {
      const buffers = await Promise.all(
        NOTO_SERIF_SC_FILES.map(async (path) => {
          const buffer = await readFile(path);
          return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        }),
      );

      return buffers.map((data) => ({
        name: "Poster Noto Serif SC",
        data,
        style: "normal" as const,
        weight: 400 as const,
      }));
    } catch (error) {
      console.warn("[poster] Local Noto Serif SC load failed", error);
      return [];
    }
  })();

  return notoSerifPosterFontsPromise;
}

async function loadPosterFontData() {
  if (posterFontDataPromise) {
    return posterFontDataPromise;
  }

  posterFontDataPromise = (async () => {
    for (const path of POSTER_FONT_CANDIDATES) {
      try {
        const buffer = await readFile(path);
        return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      } catch {
        continue;
      }
    }

    return null;
  })();

  return posterFontDataPromise;
}

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

function createPosterMarkup({
  height,
  original,
  translation,
  sourceLines,
  fontFamily,
}: {
  height: number;
  original: string;
  translation: string;
  sourceLines: string[];
  fontFamily: string;
}) {
  return (
    <div
      style={{
        width: "1080px",
        height: `${height}px`,
        display: "flex",
        background: "#f7f3ec",
        padding: "54px",
        color: "#2e241a",
        fontFamily,
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
          padding: "54px 42px 48px",
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
            fontFamily,
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
              fontFamily,
            }}
          >
            {translation}
          </div>
        ) : null}
        <div style={{ marginTop: 72, height: 1, width: "100%", background: "#e6dbce" }} />
        <div
          style={{
            marginTop: 52,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            fontSize: 31,
            color: "#7f6d5a",
            lineHeight: 1.35,
            whiteSpace: "pre-wrap",
            fontFamily,
          }}
        >
          {sourceLines.length > 0 ? sourceLines.map((line) => <div key={line}>{line}</div>) : <div>来源信息待补充</div>}
        </div>
      </div>
    </div>
  );
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

  const notoSerifPosterFonts = await loadNotoSerifPosterFonts();
  const posterFontData = await loadPosterFontData();
  const original = quote.original_text ?? "";
  const translation = quote.translation_text ?? "";
  const sourceLines = [quote.author?.name ?? null, quote.work?.title ?? null].filter((item): item is string => Boolean(item));

  const originalLines = estimateLineCount(original, 22);
  const translationLines = translation ? estimateLineCount(translation, 28) : 0;
  const sourceLinesCount = Math.max(sourceLines.length, 1);
  const height = Math.max(980, 360 + originalLines * 52 + translationLines * 44 + sourceLinesCount * 42 + 220);

  const fallbackFonts = posterFontData
    ? [
        {
          name: "Poster Unicode",
          data: posterFontData,
          style: "normal" as const,
          weight: 400 as const,
        },
      ]
    : [];

  const fallbackFamily = fallbackFonts.length > 0 ? "Poster Unicode" : "serif";

  if (notoSerifPosterFonts.length > 0) {
    try {
      return new ImageResponse(
        createPosterMarkup({
          height,
          original,
          translation,
          sourceLines,
          fontFamily: "Poster Noto Serif SC, Poster Unicode",
        }),
        {
          width: 1080,
          height,
          fonts: [...notoSerifPosterFonts, ...fallbackFonts],
        },
      );
    } catch (error) {
      console.warn("[poster] Local Noto Serif SC render failed, falling back to local unicode font", error);
    }
  }

  return new ImageResponse(
    createPosterMarkup({
      height,
      original,
      translation,
      sourceLines,
      fontFamily: fallbackFamily,
    }),
    {
      width: 1080,
      height,
      fonts: fallbackFonts,
    },
  );
}
