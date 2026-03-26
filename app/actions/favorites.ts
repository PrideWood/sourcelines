"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { clearSessionCookie } from "@/lib/auth/cookie";
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
    revalidateTag(`favorites:${session.user.id}`, "max");

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
    const code = typeof error === "object" && error != null && "code" in error ? (error as { code?: string }).code : undefined;

    // Composite key on (user_id, quote_id) guarantees uniqueness.
    // If concurrent create hits duplicate, we treat it as already favorited.
    if (code === "P2002") {
      // no-op
    } else if (code === "P2003") {
      const message = error instanceof Error ? error.message : "";

      if (message.includes("favorites_user_id_fkey")) {
        await clearSessionCookie();
        return {
          ok: false,
          favorited: false,
          redirectTo: `/login?next=${encodeURIComponent(nextPath)}`,
          message: "登录状态已失效，请重新登录后再收藏。",
        };
      }

      if (message.includes("favorites_quote_id_fkey")) {
        return {
          ok: false,
          favorited: false,
          message: "该引文不存在或已被删除。",
        };
      }

      throw error;
    } else {
      throw error;
    }
  }

  revalidatePath("/");
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath("/me/favorites");
  revalidateTag(`favorites:${session.user.id}`, "max");

  return {
    ok: true,
    favorited: true,
    message: "已加入收藏",
  };
}
