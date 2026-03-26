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

function measureGlyphUnits(character: string) {
  if (character === "\n") return 0;
  if (/\s/.test(character)) return 0.28;
  if (/[A-Z]/.test(character)) return 0.68;
  if (/[a-z]/.test(character)) return 0.56;
  if (/[0-9]/.test(character)) return 0.56;
  if (/[，。、！？；：）】》」』]/.test(character)) return 0.52;
  if (/[（【《「『]/.test(character)) return 0.64;
  if (/[.,!?;:'"`-]/.test(character)) return 0.34;
  return 1;
}

function estimateWrappedLines(text: string, maxWidth: number, fontSize: number) {
  if (text.trim().length === 0) return 1;

  const paragraphs = text.replace(/\r/g, "").split("\n");
  let lines = 0;

  for (const paragraph of paragraphs) {
    if (paragraph.trim().length === 0) {
      lines += 1;
      continue;
    }

    let currentLineWidth = 0;
    let paragraphLines = 1;

    for (const character of paragraph) {
      const characterWidth = measureGlyphUnits(character) * fontSize;

      if (currentLineWidth > 0 && currentLineWidth + characterWidth > maxWidth) {
        paragraphLines += 1;
        currentLineWidth = characterWidth;
        continue;
      }

      currentLineWidth += characterWidth;
    }

    lines += paragraphLines;
  }

  return lines;
}

function calculatePosterHeight({
  original,
  translation,
  sourceLines,
}: {
  original: string;
  translation: string;
  sourceLines: string[];
}) {
  const contentWidth = 888;
  const outerPaddingY = 108;
  const cardPaddingTop = 54;
  const cardPaddingBottom = 48;
  const brandHeight = 40;
  const brandMarginBottom = 44;
  const originalLineHeight = 54 * 1.35;
  const translationLineHeight = 36 * 1.4;
  const sourceLineHeight = 31 * 1.35;
  const translationMarginTop = translation ? 54 : 0;
  const separatorMarginTop = 72;
  const separatorHeight = 1;
  const sourceMarginTop = 52;
  const sourceGap = 12;
  const bottomSafetySpace = 40;

  const originalLines = estimateWrappedLines(original, contentWidth, 54);
  const translationLines = translation ? estimateWrappedLines(translation, contentWidth, 36) : 0;
  const resolvedSourceLines = sourceLines.length > 0 ? sourceLines : ["来源信息待补充"];
  const sourceLineCount = resolvedSourceLines.reduce(
    (count, line) => count + estimateWrappedLines(line, contentWidth, 31),
    0,
  );

  const sourceGaps = Math.max(resolvedSourceLines.length - 1, 0) * sourceGap;

  const calculatedHeight =
    outerPaddingY +
    cardPaddingTop +
    brandHeight +
    brandMarginBottom +
    originalLines * originalLineHeight +
    translationMarginTop +
    translationLines * translationLineHeight +
    separatorMarginTop +
    separatorHeight +
    sourceMarginTop +
    sourceLineCount * sourceLineHeight +
    sourceGaps +
    cardPaddingBottom +
    bottomSafetySpace;

  return Math.max(980, Math.ceil(calculatedHeight));
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
  const height = calculatePosterHeight({
    original,
    translation,
    sourceLines,
  });

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
