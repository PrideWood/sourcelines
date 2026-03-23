"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { SubmitFormState, SubmitFieldErrors } from "@/app/submit/form-state";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

function normalizeText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function submitQuoteAction(_prevState: SubmitFormState, formData: FormData): Promise<SubmitFormState> {
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
  };

  const evidenceFile = formData.get("evidence_file");
  const hasEvidenceFile = evidenceFile instanceof File && evidenceFile.size > 0;

  const fieldErrors: SubmitFieldErrors = {};

  if (!values.original_text) fieldErrors.original_text = "请输入原文。";
  if (!values.language) fieldErrors.language = "请选择原文语言。";
  if (!values.raw_work_title) fieldErrors.raw_work_title = "请输入作品名。";
  if (!values.raw_author_name) fieldErrors.raw_author_name = "请输入作者名。";
  if (!values.raw_source_location) fieldErrors.raw_source_location = "请输入出处位置。";

  if (!values.evidence_url && !hasEvidenceFile) {
    fieldErrors.evidence = "请提供证据链接，或上传一个证据文件。";
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

  try {
    await prisma.$transaction(async (tx) => {
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
        },
      });

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

      if (hasEvidenceFile) {
        const file = evidenceFile;

        await tx.submissionEvidence.create({
          data: {
            submission_id: submission.id,
            evidence_type: "OTHER",
            title: file.name || "用户上传文件",
            note: `占位文件证据：${file.name || "未命名文件"} (${file.size} bytes)`,
          },
        });
      }
    });
  } catch (error) {
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

  redirect("/me/submissions?submitted=1");
}
