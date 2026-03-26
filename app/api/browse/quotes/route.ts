import { difficulty_level, verification_status } from "@prisma/client";
import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { getBrowseQuotesPageForUser } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const session = await getSession();

  const q = searchParams.get("q")?.trim() ?? "";
  const language = searchParams.get("language")?.trim() ?? "";
  const verification = searchParams.get("verification")?.trim() ?? "";
  const difficulty = searchParams.get("difficulty")?.trim() ?? "";
  const tag = searchParams.get("tag")?.trim() ?? "";
  const translated = searchParams.get("translated")?.trim() ?? "";
  const offset = Number(searchParams.get("offset") ?? 0);
  const limit = Number(searchParams.get("limit") ?? 12);

  const result = await getBrowseQuotesPageForUser(
    session?.user.id ?? null,
    {
      q: q || undefined,
      language: language || undefined,
      verificationStatus: Object.values(verification_status).includes(verification as verification_status)
        ? verification
        : undefined,
      difficultyLevel: Object.values(difficulty_level).includes(difficulty as difficulty_level)
        ? difficulty
        : undefined,
      translated: translated === "yes" || translated === "no" ? translated : undefined,
      tagSlug: tag || undefined,
    },
    {
      offset: Number.isFinite(offset) ? offset : 0,
      limit: Number.isFinite(limit) ? limit : 12,
    },
  );

  return NextResponse.json(result);
}
