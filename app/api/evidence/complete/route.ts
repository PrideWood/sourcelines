import { evidence_upload_status } from "@prisma/client";
import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

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
    return NextResponse.json({ error: "UPLOAD_NOT_FOUND" }, { status: 404 });
  }

  if (upload.status === evidence_upload_status.DISCARDED || upload.status === evidence_upload_status.CONSUMED) {
    return NextResponse.json({ error: "UPLOAD_NOT_USABLE" }, { status: 400 });
  }

  const updated = await prisma.pendingEvidenceUpload.update({
    where: { id: upload.id },
    data: {
      status: evidence_upload_status.UPLOADED,
      uploaded_at: new Date(),
    },
    select: {
      id: true,
      object_key: true,
      filename: true,
      mime_type: true,
      size: true,
      status: true,
    },
  });

  return NextResponse.json({ upload: updated });
}
