-- Extend submission evidences for uploaded image metadata
ALTER TABLE "submission_evidences"
ADD COLUMN "object_key" TEXT,
ADD COLUMN "filename" TEXT,
ADD COLUMN "mime_type" TEXT,
ADD COLUMN "file_size" INTEGER,
ADD COLUMN "uploaded_by_user_id" TEXT;

-- Ensure IMAGE evidence type exists
DO $$ BEGIN
  ALTER TYPE "evidence_type" ADD VALUE 'IMAGE';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create upload lifecycle enum for temporary presigned uploads
DO $$ BEGIN
  CREATE TYPE "evidence_upload_status" AS ENUM ('PENDING', 'UPLOADED', 'CONSUMED', 'DISCARDED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Temporary uploaded objects waiting for submission association
CREATE TABLE IF NOT EXISTS "pending_evidence_uploads" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "object_key" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "status" "evidence_upload_status" NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "uploaded_at" TIMESTAMP(3),
  "consumed_at" TIMESTAMP(3),
  "discarded_at" TIMESTAMP(3),
  CONSTRAINT "pending_evidence_uploads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "pending_evidence_uploads_object_key_key" ON "pending_evidence_uploads"("object_key");
CREATE INDEX IF NOT EXISTS "pending_evidence_uploads_user_id_status_created_at_idx" ON "pending_evidence_uploads"("user_id", "status", "created_at");

ALTER TABLE "pending_evidence_uploads"
ADD CONSTRAINT "pending_evidence_uploads_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
