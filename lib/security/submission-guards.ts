import { moderation_status } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export class SubmissionGuardError extends Error {}

const MIN_ORIGINAL_TEXT_LENGTH = 6;
const MAX_ORIGINAL_TEXT_LENGTH = 500;
const MAX_TRANSLATION_LENGTH = 800;
const MAX_NOTE_LENGTH = 1500;
const MAX_SOURCE_LOCATION_LENGTH = 200;
const NEW_USER_WINDOW_HOURS = 24;
const MAX_NEW_USER_SUBMISSIONS = 2;
const MAX_PENDING_SUBMISSIONS = 5;

function isPureLink(text: string) {
  return /^https?:\/\/\S+$/i.test(text.trim());
}

function isObviousNoise(text: string) {
  const normalized = text.replace(/\s+/g, "");
  if (normalized.length < 8) {
    return false;
  }

  const uniqueChars = new Set(normalized);
  if (uniqueChars.size <= 2) {
    return true;
  }

  return /(.)\1{7,}/u.test(normalized);
}

export function validateSubmissionPayload({
  originalText,
  translationText,
  note,
  sourceLocation,
}: {
  originalText: string;
  translationText: string;
  note: string;
  sourceLocation: string;
}) {
  if (originalText.length < MIN_ORIGINAL_TEXT_LENGTH) {
    throw new SubmissionGuardError(`原文至少需要 ${MIN_ORIGINAL_TEXT_LENGTH} 个字符。`);
  }

  if (originalText.length > MAX_ORIGINAL_TEXT_LENGTH) {
    throw new SubmissionGuardError(`原文请控制在 ${MAX_ORIGINAL_TEXT_LENGTH} 个字符以内。`);
  }

  if (translationText.length > MAX_TRANSLATION_LENGTH) {
    throw new SubmissionGuardError(`译文请控制在 ${MAX_TRANSLATION_LENGTH} 个字符以内。`);
  }

  if (note.length > MAX_NOTE_LENGTH) {
    throw new SubmissionGuardError(`投稿备注请控制在 ${MAX_NOTE_LENGTH} 个字符以内。`);
  }

  if (sourceLocation.length > MAX_SOURCE_LOCATION_LENGTH) {
    throw new SubmissionGuardError(`出处位置请控制在 ${MAX_SOURCE_LOCATION_LENGTH} 个字符以内。`);
  }

  if (isPureLink(originalText)) {
    throw new SubmissionGuardError("原文不能只是一条链接。");
  }

  if (isObviousNoise(originalText)) {
    throw new SubmissionGuardError("原文看起来像无意义内容，请检查后再提交。");
  }
}

export async function ensureSubmissionAllowed({
  userId,
  language,
  originalText,
  quoteId,
}: {
  userId: string;
  language: string;
  originalText: string;
  quoteId?: string;
}) {
  const now = new Date();
  const newUserCutoff = new Date(now.getTime() - NEW_USER_WINDOW_HOURS * 60 * 60 * 1000);

  const [user, pendingCount, recentCount, existingQuote, existingSubmission] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        created_at: true,
      },
    }),
    prisma.submission.count({
      where: {
        submitter_id: userId,
        moderation_status: {
          in: [moderation_status.PENDING, moderation_status.REVISION_REQUIRED],
        },
      },
    }),
    prisma.submission.count({
      where: {
        submitter_id: userId,
        created_at: {
          gte: newUserCutoff,
        },
      },
    }),
    prisma.quote.findFirst({
      where: {
        original_language: language,
        original_text: originalText,
        ...(quoteId ? { id: { not: quoteId } } : {}),
      },
      select: { id: true },
    }),
    prisma.submission.findFirst({
      where: {
        original_language: language,
        original_text: originalText,
        moderation_status: {
          in: [moderation_status.PENDING, moderation_status.REVISION_REQUIRED, moderation_status.APPROVED],
        },
        ...(quoteId ? { published_quote_id: { not: quoteId } } : {}),
      },
      select: { id: true },
    }),
  ]);

  if (!user) {
    throw new SubmissionGuardError("登录状态已失效，请重新登录后再提交。");
  }

  if (pendingCount >= MAX_PENDING_SUBMISSIONS) {
    throw new SubmissionGuardError("你当前待处理的投稿较多，请等待部分审核完成后再继续提交。");
  }

  if (user.created_at >= newUserCutoff && recentCount >= MAX_NEW_USER_SUBMISSIONS) {
    throw new SubmissionGuardError("新注册账号在首日的投稿次数已达上限，请稍后再试。");
  }

  if (existingQuote || existingSubmission) {
    throw new SubmissionGuardError("系统中已存在相同原文内容，请优先通过补充信息或审核流程处理。");
  }
}

export async function getSubmitterAbuseSummary(userId: string) {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [pendingCount, recentCount] = await Promise.all([
    prisma.submission.count({
      where: {
        submitter_id: userId,
        moderation_status: {
          in: [moderation_status.PENDING, moderation_status.REVISION_REQUIRED],
        },
      },
    }),
    prisma.submission.count({
      where: {
        submitter_id: userId,
        created_at: {
          gte: since24h,
        },
      },
    }),
  ]);

  return {
    pendingCount,
    recentCount,
  };
}
