"use server";

import { moderation_status } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type ReviewDecision = "approved" | "revision_required" | "rejected";

function toModerationStatus(decision: ReviewDecision) {
  if (decision === "approved") return moderation_status.APPROVED;
  if (decision === "revision_required") return moderation_status.REVISION_REQUIRED;
  return moderation_status.REJECTED;
}

export async function reviewSubmissionAction(formData: FormData) {
  const session = await getSession();

  if (!session) {
    redirect(`/login?next=${encodeURIComponent("/admin/submissions")}`);
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  const submissionId = String(formData.get("submission_id") ?? "").trim();
  const decision = String(formData.get("decision") ?? "") as ReviewDecision;
  const reviewNote = String(formData.get("review_note") ?? "").trim();

  if (!submissionId || !["approved", "revision_required", "rejected"].includes(decision)) {
    redirect(`/admin/submissions?error=invalid_request`);
  }

  try {
    await prisma.$transaction(async (tx) => {
      const submission = await tx.submission.findUnique({ where: { id: submissionId } });

      if (!submission) {
        throw new Error("NOT_FOUND");
      }

      let publishedQuoteId = submission.published_quote_id;

      if (decision === "approved") {
        if (!publishedQuoteId) {
          const createdQuote = await tx.quote.create({
            data: {
              original_text: submission.original_text,
              translation_text: submission.translation_text,
              original_language: submission.original_language,
              source_title: submission.source_work_title ?? submission.source_title ?? null,
              source_locator: submission.source_locator,
              moderation_status: moderation_status.APPROVED,
              verification_status: submission.verification_status,
            },
          });

          publishedQuoteId = createdQuote.id;
        }
      } else {
        publishedQuoteId = null;
      }

      await tx.submission.update({
        where: { id: submission.id },
        data: {
          moderation_status: toModerationStatus(decision),
          review_note: reviewNote || null,
          reviewed_by_id: session.user.id,
          reviewed_at: new Date(),
          published_quote_id: publishedQuoteId,
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      redirect(`/admin/submissions?error=not_found`);
    }

    console.error("[reviewSubmissionAction] failed", error);
    redirect(`/admin/submissions/${submissionId}?error=unknown`);
  }

  revalidatePath("/admin/submissions");
  revalidatePath(`/admin/submissions/${submissionId}`);
  revalidatePath("/quotes");

  redirect(`/admin/submissions/${submissionId}?updated=1`);
}
