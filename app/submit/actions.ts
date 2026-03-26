"use server";

import { Prisma, evidence_upload_status } from "@prisma/client";
import { revalidatePath, revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { SubmitFormState, SubmitFieldErrors } from "@/app/submit/form-state";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getRequestIp } from "@/lib/security/request";
import { enforceRateLimit, RateLimitError } from "@/lib/security/rate-limit";
import { ensureSubmissionAllowed, SubmissionGuardError, validateSubmissionPayload } from "@/lib/security/submission-guards";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import { ensureSubmissionTagsTable } from "@/lib/submission-tags";

function normalizeText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function submitQuoteAction(_prevState: SubmitFormState, formData: FormData): Promise<SubmitFormState> {
  const quoteId = normalizeText(formData.get("quote_id"));
  const turnstileToken = normalizeText(formData.get("turnstile_token"));
  const values = {
    original_text: normalizeText(formData.get("original_text")),
    language: normalizeText(formData.get("language")).toLowerCase(),
    raw_work_title: normalizeText(formData.get("raw_work_title")),
    raw_author_name: normalizeText(formData.get("raw_author_name")),
    speaker_name: normalizeText(formData.get("speaker_name")),
    genre_type: normalizeText(formData.get("genre_type")),
    raw_source_location: normalizeText(formData.get("raw_source_location")),
    raw_translated_text: normalizeText(formData.get("raw_translated_text")),
    raw_note: normalizeText(formData.get("raw_note")),
    evidence_url: normalizeText(formData.get("evidence_url")),
    tag_ids: formData
      .getAll("tag_ids")
      .map((item) => String(item).trim())
      .filter((item) => item.length > 0),
    uploaded_evidence_ids: formData
      .getAll("uploaded_evidence_ids")
      .map((item) => String(item).trim())
      .filter((item) => item.length > 0),
  };

  const fieldErrors: SubmitFieldErrors = {};

  if (!values.original_text) fieldErrors.original_text = "请输入原文。";
  if (!values.language) fieldErrors.language = "请选择原文语言。";
  if (!values.raw_work_title) fieldErrors.raw_work_title = "请输入作品名。";
  if (!values.raw_author_name) fieldErrors.raw_author_name = "请输入作者名。";
  if (!values.raw_source_location) fieldErrors.raw_source_location = "请输入出处位置。";
  if (values.tag_ids.length === 0) fieldErrors.tag_ids = "请至少选择一个标签。";

  const isUpdateFlow = quoteId.length > 0;

  if (!isUpdateFlow && !values.evidence_url && values.uploaded_evidence_ids.length === 0) {
    fieldErrors.evidence = "请提供证据链接，或上传至少一张证据图片。";
  }

  if (values.uploaded_evidence_ids.length > 3) {
    fieldErrors.evidence = "证据图片最多 3 张。";
  }

  if (values.evidence_url) {
    try {
      const parsed = new URL(values.evidence_url);
      if (!(parsed.protocol === "http:" || parsed.protocol === "https:")) {
        fieldErrors.evidence = "证据链接需以 http(s) 开头。";
      }
    } catch {
      fieldErrors.evidence = "证据链接格式不正确。";
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      formError: "提交失败，请先修正表单中的问题。",
      fieldErrors,
      values,
    };
  }

  const session = await getSession();

  if (!session) {
    redirect(`/login?next=${encodeURIComponent("/submit")}`);
  }

  const requestHeaders = await headers();
  const ip = getRequestIp(requestHeaders);

  try {
    await enforceRateLimit({
      key: quoteId ? `submit:revision:user:${session.user.id}` : `submit:new:user:${session.user.id}`,
      limit: quoteId ? 4 : 3,
      windowSeconds: 60 * 60,
      message: "提交过于频繁，请稍后再试。",
    });
    await enforceRateLimit({
      key: `submit:ip:${ip}`,
      limit: 10,
      windowSeconds: 60 * 60,
      message: "提交过于频繁，请稍后再试。",
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return {
        formError: error.message,
        fieldErrors: {},
        values,
      };
    }
    throw error;
  }

  const turnstilePassed = await verifyTurnstileToken({
    token: turnstileToken,
    ip,
  });

  if (!turnstilePassed) {
    return {
      formError: "人机验证未通过，请重试。",
      fieldErrors: {},
      values,
    };
  }

  try {
    validateSubmissionPayload({
      originalText: values.original_text,
      translationText: values.raw_translated_text,
      note: values.raw_note,
      sourceLocation: values.raw_source_location,
    });
    await ensureSubmissionAllowed({
      userId: session.user.id,
      language: values.language,
      originalText: values.original_text,
      quoteId: quoteId || undefined,
    });
  } catch (error) {
    if (error instanceof SubmissionGuardError) {
      return {
        formError: error.message,
        fieldErrors: {},
        values,
      };
    }
    throw error;
  }

  const allowSubmissionTags = values.tag_ids.length > 0 ? await ensureSubmissionTagsTable() : false;
  if (values.tag_ids.length > 0 && !allowSubmissionTags) {
    return {
      formError: "标签保存失败：数据库标签关联结构不可用，请联系管理员执行迁移后重试。",
      fieldErrors: {},
      values,
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const existingTags = values.tag_ids.length
        ? await tx.tag.findMany({
            where: { id: { in: values.tag_ids } },
            select: { id: true, tag_type: true },
          })
        : [];

      const learningTagCount = existingTags.filter((item) => item.tag_type === "LEARNING").length;
      if (learningTagCount > 1) {
        throw new Error("MULTIPLE_LEARNING_TAGS");
      }

      if (isUpdateFlow) {
        const targetQuote = await tx.quote.findUnique({ where: { id: quoteId }, select: { id: true } });
        if (!targetQuote) {
          throw new Error("QUOTE_NOT_FOUND");
        }
      }

      const submission = await tx.submission.create({
        data: {
          submitter_id: session.user.id,
          original_text: values.original_text,
          translation_text: values.raw_translated_text || null,
          original_language: values.language,
          source_work_title: values.raw_work_title,
          source_author_name: values.raw_author_name,
          speaker_name: values.speaker_name || null,
          genre_type: values.genre_type || "unknown",
          source_locator: values.raw_source_location,
          raw_note: values.raw_note || null,
          published_quote_id: isUpdateFlow ? quoteId : null,
        },
      });

      if (allowSubmissionTags && existingTags.length > 0) {
        const valuesSql = existingTags.map((tag) => Prisma.sql`(${submission.id}, ${tag.id})`);
        await tx.$executeRaw(
          Prisma.sql`
            INSERT INTO "submission_tags" ("submission_id", "tag_id")
            VALUES ${Prisma.join(valuesSql)}
            ON CONFLICT ("submission_id", "tag_id") DO NOTHING
          `,
        );
      }

      if (values.evidence_url) {
        await tx.submissionEvidence.create({
          data: {
            submission_id: submission.id,
            evidence_type: "WEBSITE",
            url: values.evidence_url,
            title: "用户提交的证据链接",
          },
        });
      }

      if (values.uploaded_evidence_ids.length > 0) {
        const uploads = await tx.pendingEvidenceUpload.findMany({
          where: {
            id: { in: values.uploaded_evidence_ids },
            user_id: session.user.id,
            status: evidence_upload_status.UPLOADED,
          },
        });

        if (uploads.length !== values.uploaded_evidence_ids.length) {
          throw new Error("INVALID_EVIDENCE_UPLOADS");
        }

        await tx.submissionEvidence.createMany({
          data: uploads.map((upload) => ({
            submission_id: submission.id,
            evidence_type: "IMAGE",
            title: "用户上传证据图片",
            object_key: upload.object_key,
            filename: upload.filename,
            mime_type: upload.mime_type,
            file_size: upload.size,
            uploaded_by_user_id: session.user.id,
          })),
        });

        await tx.pendingEvidenceUpload.updateMany({
          where: {
            id: { in: uploads.map((upload) => upload.id) },
            user_id: session.user.id,
            status: evidence_upload_status.UPLOADED,
          },
          data: {
            status: evidence_upload_status.CONSUMED,
            consumed_at: new Date(),
          },
        });
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "QUOTE_NOT_FOUND") {
      return {
        formError: "当前条目不存在或已被删除，请返回详情页重试。",
        fieldErrors: {},
        values,
      };
    }
    if (error instanceof Error && error.message === "MULTIPLE_LEARNING_TAGS") {
      return {
        formError: "学习难度只能选择一个。",
        fieldErrors: {
          tag_ids: "学习难度只能选择一个。",
        },
        values,
      };
    }
    if (error instanceof Error && error.message === "INVALID_EVIDENCE_UPLOADS") {
      return {
        formError: "证据图片状态异常，请重新上传后再提交。",
        fieldErrors: {
          evidence: "证据图片状态异常，请重新上传。",
        },
        values,
      };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return {
          formError: "所选语言不存在，请刷新页面后重试。",
          fieldErrors: {
            language: "语言无效，请重新选择。",
          },
          values,
        };
      }

      if (error.code === "P2022" || error.code === "P2021") {
        return {
          formError:
            "数据库结构与当前代码不一致，请先执行数据库迁移（npm run prisma:migrate），然后重试提交。",
          fieldErrors: {},
          values,
        };
      }

      if (
        error.code === "P2010" &&
        typeof error.meta?.code === "string" &&
        error.meta.code === "42P01"
      ) {
        return {
          formError:
            "数据库缺少最新表结构，请执行数据库迁移（npm run prisma:migrate）后重试。",
          fieldErrors: {},
          values,
        };
      }
    }

    console.error("[submitQuoteAction] failed", error);
    return {
      formError: "提交失败，服务器暂时不可用，请稍后再试。",
      fieldErrors: {},
      values,
    };
  }

  revalidatePath("/me/submissions");
  revalidatePath("/admin/review");
  revalidatePath("/admin/submissions");
  revalidatePath("/quotes");
  revalidateTag(`submissions:${session.user.id}`, "max");
  if (isUpdateFlow) {
    revalidatePath(`/quotes/${quoteId}`);
    redirect(`/quotes/${quoteId}?revision_submitted=1`);
  }

  redirect("/me/submissions?submitted=1");
}
