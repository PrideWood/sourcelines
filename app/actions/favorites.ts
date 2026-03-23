"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export type ToggleFavoriteResult = {
  ok: boolean;
  favorited: boolean;
  redirectTo?: string;
  message?: string;
};

export async function toggleFavoriteAction(quoteId: string, nextPath: string): Promise<ToggleFavoriteResult> {
  const session = await getSession();

  if (!session) {
    return {
      ok: false,
      favorited: false,
      redirectTo: `/login?next=${encodeURIComponent(nextPath)}`,
      message: "请先登录后再收藏。",
    };
  }

  const favoriteKey = {
    user_id_quote_id: {
      user_id: session.user.id,
      quote_id: quoteId,
    },
  } as const;

  const existing = await prisma.favorite.findUnique({ where: favoriteKey });

  if (existing) {
    await prisma.favorite.delete({ where: favoriteKey });

    revalidatePath("/");
    revalidatePath("/quotes");
    revalidatePath(`/quotes/${quoteId}`);
    revalidatePath("/me/favorites");

    return {
      ok: true,
      favorited: false,
      message: "已取消收藏",
    };
  }

  try {
    await prisma.favorite.create({
      data: {
        user_id: session.user.id,
        quote_id: quoteId,
      },
    });
  } catch (error) {
    // Composite key on (user_id, quote_id) guarantees uniqueness.
    // If concurrent create hits duplicate, we treat it as already favorited.
    if (!(error instanceof Error) || !("code" in error) || (error as { code?: string }).code !== "P2002") {
      throw error;
    }
  }

  revalidatePath("/");
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath("/me/favorites");

  return {
    ok: true,
    favorited: true,
    message: "已加入收藏",
  };
}
