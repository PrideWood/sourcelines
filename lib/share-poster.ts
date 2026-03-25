export const POSTER_WIDTH = 1080;
export const POSTER_MIN_HEIGHT = 980;
const IMAGE_LOAD_TIMEOUT_MS = 12000;
const PNG_EXPORT_TIMEOUT_MS = 8000;

export type SharePosterPayload = {
  originalText: string;
  translationText?: string | null;
  authorName?: string | null;
  workTitle?: string | null;
};

function escapeXml(input: string) {
  return input
    .split("&")
    .join("&amp;")
    .split("<")
    .join("&lt;")
    .split(">")
    .join("&gt;")
    .split('"')
    .join("&quot;");
}

function measureTextWidth(text: string, font: string) {
  // Keep server/client output deterministic to avoid hydration mismatch.
  const sizeMatch = font.match(/(\d+(?:\.\d+)?)px/);
  const fontSize = sizeMatch ? Number(sizeMatch[1]) : 16;
  let width = 0;
  for (const ch of text) {
    if (/\s/.test(ch)) {
      width += fontSize * 0.35;
      continue;
    }
    if (/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(ch)) {
      width += fontSize;
      continue;
    }
    if (/[A-Z0-9]/.test(ch)) {
      width += fontSize * 0.62;
      continue;
    }
    width += fontSize * 0.54;
  }
  return width;
}

function wrapLinesByWidth(text: string, maxWidth: number, font: string, maxLines: number) {
  const lines: string[] = [];
  const paragraphs = text.replace(/\r/g, "").split("\n");

  for (const paragraph of paragraphs) {
    if (lines.length >= maxLines) break;
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
        if (lines.length >= maxLines) return lines.slice(0, maxLines);
        current = "";
      }

      if (measureTextWidth(token, font) <= maxWidth) {
        current = token.trimStart();
        continue;
      }

      let segment = "";
      for (const ch of token) {
        const nextSegment = segment + ch;
        if (measureTextWidth(nextSegment, font) <= maxWidth) {
          segment = nextSegment;
          continue;
        }
        if (segment.length > 0) {
          lines.push(segment);
          if (lines.length >= maxLines) return lines.slice(0, maxLines);
        }
        segment = ch;
      }
      current = segment;
    }

    if (current.length > 0) lines.push(current.trimEnd());
  }

  return lines.slice(0, maxLines);
}

export function buildPosterSvg({ originalText, translationText, authorName, workTitle }: SharePosterPayload) {
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

function loadImageWithTimeout(src: string, timeoutMs: number) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    let finished = false;
    const timer = window.setTimeout(() => {
      if (finished) return;
      finished = true;
      reject(new Error("POSTER_IMAGE_LOAD_TIMEOUT"));
    }, timeoutMs);

    image.onload = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timer);
      resolve(image);
    };

    image.onerror = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timer);
      reject(new Error("POSTER_IMAGE_LOAD_FAILED"));
    };

    image.src = src;
  });
}

export async function svgToPngBlob(svg: string, width: number, height: number) {
  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const blobUrl = URL.createObjectURL(svgBlob);
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  let image: HTMLImageElement | null = null;
  let loadErrorMessage = "POSTER_IMAGE_LOAD_FAILED";

  for (const src of [dataUrl, blobUrl]) {
    try {
      image = await loadImageWithTimeout(src, IMAGE_LOAD_TIMEOUT_MS);
      break;
    } catch (error) {
      if (error instanceof Error) {
        loadErrorMessage = error.message;
      }
    }
  }

  URL.revokeObjectURL(blobUrl);
  if (!image) {
    throw new Error(loadErrorMessage);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("POSTER_CANVAS_CONTEXT_MISSING");
  }

  context.drawImage(image, 0, 0, width, height);

  return new Promise<Blob>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error("POSTER_PNG_EXPORT_TIMEOUT"));
    }, PNG_EXPORT_TIMEOUT_MS);

    canvas.toBlob((nextBlob) => {
      window.clearTimeout(timer);
      if (!nextBlob) {
        reject(new Error("POSTER_PNG_EXPORT_FAILED"));
        return;
      }
      resolve(nextBlob);
    }, "image/png");
  });
}
