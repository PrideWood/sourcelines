"use server";

import { Prisma, moderation_status } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { hasSubmissionTagsTable } from "@/lib/submission-tags";

type ReviewDecision = "approved" | "revision_required" | "rejected";

function toModerationStatus(decision: ReviewDecision) {
  if (decision === "approved") return moderation_status.APPROVED;
  if (decision === "revision_required") return moderation_status.REVISION_REQUIRED;
  return moderation_status.REJECTED;
}

function normalizeInput(value: string | null | undefined) {
  const normalized = (value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

function createBaseSlug(value: string, fallback: "author" | "work") {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || fallback;
}

async function buildUniqueAuthorSlug(tx: Prisma.TransactionClient, name: string) {
  const base = createBaseSlug(name, "author");
  let slug = base;
  let index = 2;

  while (await tx.author.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${index}`;
    index += 1;
  }

  return slug;
}

async function buildUniqueWorkSlug(tx: Prisma.TransactionClient, title: string) {
  const base = createBaseSlug(title, "work");
  let slug = base;
  let index = 2;

  while (await tx.work.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${index}`;
    index += 1;
  }

  return slug;
}

async function resolveAuthorId(tx: Prisma.TransactionClient, sourceAuthorName: string | null | undefined) {
  const authorName = normalizeInput(sourceAuthorName);
  if (!authorName) {
    return null;
  }

  const authorSlug = createBaseSlug(authorName, "author");
  const existingAuthor = await tx.author.findFirst({
    where: {
      OR: [{ slug: authorSlug }, { name: { equals: authorName, mode: "insensitive" } }],
    },
    select: { id: true },
  });

  if (existingAuthor) {
    return existingAuthor.id;
  }

  const uniqueSlug = await buildUniqueAuthorSlug(tx, authorName);
  const createdAuthor = await tx.author.create({
    data: {
      name: authorName,
      slug: uniqueSlug,
    },
    select: { id: true },
  });

  return createdAuthor.id;
}

async function resolveWorkId(
  tx: Prisma.TransactionClient,
  sourceWorkTitle: string | null | undefined,
  authorId: string | null,
) {
  const workTitle = normalizeInput(sourceWorkTitle);
  if (!workTitle) {
    return null;
  }

  const workSlug = createBaseSlug(workTitle, "work");
  let existingWork = null as { id: string; author_id: string | null } | null;

  if (authorId) {
    existingWork = await tx.work.findFirst({
      where: { title: { equals: workTitle, mode: "insensitive" }, author_id: authorId },
      select: { id: true, author_id: true },
    });
  }

  if (!existingWork) {
    existingWork = await tx.work.findFirst({
      where: {
        OR: [{ slug: workSlug }, { title: { equals: workTitle, mode: "insensitive" } }],
      },
      select: { id: true, author_id: true },
    });
  }

  if (existingWork) {
    if (authorId && !existingWork.author_id) {
      await tx.work.update({
        where: { id: existingWork.id },
        data: { author_id: authorId },
      });
    }
    return existingWork.id;
  }

  const uniqueSlug = await buildUniqueWorkSlug(tx, workTitle);
  const createdWork = await tx.work.create({
    data: {
      title: workTitle,
      slug: uniqueSlug,
      author_id: authorId,
    },
    select: { id: true },
  });

  return createdWork.id;
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
    const allowSubmissionTags = await hasSubmissionTagsTable();

    await prisma.$transaction(async (tx) => {
      const submission = await tx.submission.findUnique({
        where: { id: submissionId },
      });

      if (!submission) {
        throw new Error("NOT_FOUND");
      }

      let publishedQuoteId = submission.published_quote_id;

      if (decision === "approved") {
        const authorId = await resolveAuthorId(tx, submission.source_author_name);
        const workId = await resolveWorkId(tx, submission.source_work_title, authorId);

        if (!publishedQuoteId) {
          const createdQuote = await tx.quote.create({
            data: {
              original_text: submission.original_text,
              translation_text: submission.translation_text,
              original_language: submission.original_language,
              author_id: authorId,
              work_id: workId,
              source_title: submission.source_work_title ?? submission.source_title ?? null,
              source_locator: submission.source_locator,
              moderation_status: moderation_status.APPROVED,
              verification_status: submission.verification_status,
            },
          });

          publishedQuoteId = createdQuote.id;
        } else {
          await tx.quote.update({
            where: { id: publishedQuoteId },
            data: {
              original_text: submission.original_text,
              translation_text: submission.translation_text,
              original_language: submission.original_language,
              author_id: authorId,
              work_id: workId,
              source_title: submission.source_work_title ?? submission.source_title ?? null,
              source_locator: submission.source_locator,
              moderation_status: moderation_status.APPROVED,
              verification_status: submission.verification_status,
            },
          });
        }

        if (!publishedQuoteId) {
          throw new Error("QUOTE_CREATE_FAILED");
        }
        const quoteIdForTags = publishedQuoteId;

        await tx.quoteTag.deleteMany({ where: { quote_id: quoteIdForTags } });
        const submissionTags = allowSubmissionTags
          ? await tx.$queryRaw<Array<{ tag_id: string }>>(
              Prisma.sql`
                SELECT "tag_id"
                FROM "submission_tags"
                WHERE "submission_id" = ${submission.id}
              `,
            )
          : [];
        if (submissionTags.length > 0) {
          await tx.quoteTag.createMany({
            data: submissionTags.map((item) => ({
              quote_id: quoteIdForTags,
              tag_id: item.tag_id,
            })),
            skipDuplicates: true,
          });
        }
      } else {
        publishedQuoteId = submission.published_quote_id ?? null;
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
