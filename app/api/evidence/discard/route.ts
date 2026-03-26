import { evidence_upload_status } from "@prisma/client";
import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { deleteObjectByKey } from "@/lib/r2";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let payload: { uploadId?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const uploadId = String(payload.uploadId ?? "").trim();
  if (!uploadId) {
    return NextResponse.json({ error: "MISSING_UPLOAD_ID" }, { status: 400 });
  }

  const upload = await prisma.pendingEvidenceUpload.findFirst({
    where: {
      id: uploadId,
      user_id: session.user.id,
    },
  });

  if (!upload) {
    return NextResponse.json({ ok: true });
  }

  if (upload.status === evidence_upload_status.CONSUMED) {
    return NextResponse.json({ error: "UPLOAD_ALREADY_CONSUMED" }, { status: 400 });
  }

  try {
    await deleteObjectByKey(upload.object_key);
  } catch {
    // Best effort delete for orphan cleanup.
  }

  await prisma.pendingEvidenceUpload.update({
    where: { id: upload.id },
    data: {
      status: evidence_upload_status.DISCARDED,
      discarded_at: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
