import { evidence_upload_status } from "@prisma/client";
import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { buildEvidenceObjectKey, getEvidenceLimits, getPresignedPutUrl, validateEvidenceImageInput } from "@/lib/r2";
import { getRequestIp } from "@/lib/security/request";
import { enforceRateLimit, RateLimitError } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const ip = getRequestIp(request);

  try {
    await enforceRateLimit({
      key: `evidence:presign:user:${session.user.id}`,
      limit: 10,
      windowSeconds: 10 * 60,
      message: "上传请求过于频繁，请稍后再试。",
    });
    await enforceRateLimit({
      key: `evidence:presign:ip:${ip}`,
      limit: 20,
      windowSeconds: 10 * 60,
      message: "上传请求过于频繁，请稍后再试。",
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
    }
    throw error;
  }

  let payload: { filename?: string; mimeType?: string; size?: number };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const filename = String(payload.filename ?? "").trim();
  const mimeType = String(payload.mimeType ?? "").trim().toLowerCase();
  const size = Number(payload.size ?? 0);

  if (!filename) {
    return NextResponse.json({ error: "MISSING_FILENAME" }, { status: 400 });
  }

  try {
    validateEvidenceImageInput({ mimeType, size });
  } catch (error) {
    const message = error instanceof Error ? error.message : "INVALID_FILE";
    return NextResponse.json({ error: message, limits: getEvidenceLimits() }, { status: 400 });
  }

  const activeUploadCount = await prisma.pendingEvidenceUpload.count({
    where: {
      user_id: session.user.id,
      status: {
        in: [evidence_upload_status.PENDING, evidence_upload_status.UPLOADED],
      },
    },
  });

  const limits = getEvidenceLimits();
  if (activeUploadCount >= limits.maxCount) {
    return NextResponse.json({ error: "TOO_MANY_FILES", limits }, { status: 400 });
  }

  const uploadId = crypto.randomUUID();
  const objectKey = buildEvidenceObjectKey({
    userId: session.user.id,
    uploadId,
    filename,
    mimeType,
  });

  const uploadUrl = await getPresignedPutUrl({
    objectKey,
    mimeType,
    expiresInSeconds: 600,
  });

  const pending = await prisma.pendingEvidenceUpload.create({
    data: {
      id: uploadId,
      user_id: session.user.id,
      object_key: objectKey,
      filename,
      mime_type: mimeType,
      size,
      status: evidence_upload_status.PENDING,
    },
    select: {
      id: true,
      object_key: true,
      filename: true,
      mime_type: true,
      size: true,
    },
  });

  return NextResponse.json({
    upload: pending,
    uploadUrl,
    expiresIn: 600,
    limits,
  });
}
