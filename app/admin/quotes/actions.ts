"use server";

import { Prisma, difficulty_level, verification_status } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const allowedVerification = new Set(Object.values(verification_status));
const allowedDifficulty = new Set(Object.values(difficulty_level));

export async function updateQuoteAction(formData: FormData) {
  const session = await getSession();

  if (!session) {
    redirect(`/login?next=${encodeURIComponent("/admin/quotes")}`);
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  const quoteId = String(formData.get("quote_id") ?? "").trim();
  const originalText = String(formData.get("original_text") ?? "").trim();
  const translationText = String(formData.get("translation_text") ?? "").trim();
  const originalLanguage = String(formData.get("original_language") ?? "").trim().toLowerCase();
  const sourceLocator = String(formData.get("source_locator") ?? "").trim();
  const verificationStatusRaw = String(formData.get("verification_status") ?? "").trim();
  const difficultyRaw = String(formData.get("difficulty_level") ?? "").trim();
  const authorId = String(formData.get("author_id") ?? "").trim();
  const workId = String(formData.get("work_id") ?? "").trim();
  const tagIds = formData
    .getAll("tag_ids")
    .map((item) => String(item).trim())
    .filter((item) => item.length > 0);

  if (!quoteId || !originalText || !originalLanguage) {
    redirect(`/admin/quotes/${quoteId || ""}?error=missing_required`);
  }

  if (!allowedVerification.has(verificationStatusRaw as verification_status)) {
    redirect(`/admin/quotes/${quoteId}?error=invalid_verification`);
  }

  if (!allowedDifficulty.has(difficultyRaw as difficulty_level)) {
    redirect(`/admin/quotes/${quoteId}?error=invalid_difficulty`);
  }

  try {
    await prisma.$transaction(async (tx) => {
      const validTags = tagIds.length
        ? await tx.tag.findMany({
            where: { id: { in: tagIds } },
            select: { id: true, tag_type: true },
          })
        : [];

      const learningTagCount = validTags.filter((item) => item.tag_type === "LEARNING").length;
      if (learningTagCount > 1) {
        redirect(`/admin/quotes/${quoteId}?error=invalid_learning_tags`);
      }

      await tx.quote.update({
        where: { id: quoteId },
        data: {
          original_text: originalText,
          translation_text: translationText || null,
          original_language: originalLanguage,
          source_locator: sourceLocator || null,
          verification_status: verificationStatusRaw as verification_status,
          difficulty_level: difficultyRaw as difficulty_level,
          author_id: authorId || null,
          work_id: workId || null,
        },
      });

      await tx.quoteTag.deleteMany({ where: { quote_id: quoteId } });
      if (validTags.length > 0) {
        await tx.quoteTag.createMany({
          data: validTags.map((tag) => ({
            quote_id: quoteId,
            tag_id: tag.id,
          })),
          skipDuplicates: true,
        });
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      redirect(`/admin/quotes/${quoteId}?error=foreign_key`);
    }

    console.error("[updateQuoteAction] failed", error);
    redirect(`/admin/quotes/${quoteId}?error=unknown`);
  }

  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/quotes/${quoteId}`);
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${quoteId}`);

  redirect(`/admin/quotes/${quoteId}?updated=1`);
}

export async function deleteQuoteAction(formData: FormData) {
  const session = await getSession();

  if (!session) {
    redirect(`/login?next=${encodeURIComponent("/admin/quotes")}`);
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  const quoteId = String(formData.get("quote_id") ?? "").trim();

  if (!quoteId) {
    redirect("/admin/quotes?error=invalid_request");
  }

  try {
    await prisma.quote.delete({ where: { id: quoteId } });
  } catch (error) {
    console.error("[deleteQuoteAction] failed", error);
    redirect(`/admin/quotes/${quoteId}?error=delete_failed`);
  }

  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/quotes/${quoteId}`);
  revalidatePath("/quotes");
  revalidatePath("/");

  redirect("/admin/quotes?deleted=1");
}
