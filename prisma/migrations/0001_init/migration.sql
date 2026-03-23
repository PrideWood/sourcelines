-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "moderation_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "verification_status" AS ENUM ('UNVERIFIED', 'PARTIALLY_VERIFIED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "difficulty_level" AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "tag_type" AS ENUM ('SOURCE', 'THEME', 'LEARNING', 'MOOD');

-- CreateEnum
CREATE TYPE "evidence_type" AS ENUM ('BOOK', 'ARTICLE', 'WEBSITE', 'ARCHIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "report_status" AS ENUM ('PENDING', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "languages" (
    "code" VARCHAR(16) NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_native" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "authors" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_native" TEXT,
    "bio" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "authors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "works" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "title_native" TEXT,
    "author_id" TEXT,
    "language_code" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "works_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "original_text" TEXT NOT NULL,
    "translation_text" TEXT,
    "original_language" TEXT NOT NULL,
    "author_id" TEXT,
    "work_id" TEXT,
    "source_title" TEXT,
    "source_locator" TEXT,
    "moderation_status" "moderation_status" NOT NULL DEFAULT 'APPROVED',
    "verification_status" "verification_status" NOT NULL DEFAULT 'UNVERIFIED',
    "difficulty_level" "difficulty_level" NOT NULL DEFAULT 'UNKNOWN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_evidences" (
    "id" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "evidence_type" "evidence_type" NOT NULL DEFAULT 'OTHER',
    "title" TEXT,
    "url" TEXT,
    "excerpt" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_evidences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tag_type" "tag_type" NOT NULL DEFAULT 'THEME',
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_tags" (
    "quote_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "quote_tags_pkey" PRIMARY KEY ("quote_id","tag_id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "submitter_id" TEXT NOT NULL,
    "original_text" TEXT NOT NULL,
    "translation_text" TEXT,
    "original_language" TEXT NOT NULL,
    "source_title" TEXT,
    "source_author_name" TEXT,
    "source_work_title" TEXT,
    "source_published_at" TIMESTAMP(3),
    "source_locator" TEXT,
    "moderation_status" "moderation_status" NOT NULL DEFAULT 'PENDING',
    "verification_status" "verification_status" NOT NULL DEFAULT 'UNVERIFIED',
    "review_note" TEXT,
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "published_quote_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_evidences" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "evidence_type" "evidence_type" NOT NULL DEFAULT 'OTHER',
    "title" TEXT,
    "url" TEXT,
    "excerpt" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submission_evidences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "user_id" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("user_id","quote_id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reporter_user_id" TEXT NOT NULL,
    "quote_id" TEXT,
    "submission_id" TEXT,
    "reason_code" TEXT NOT NULL,
    "detail" TEXT,
    "status" "report_status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE INDEX "languages_is_active_idx" ON "languages"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "authors_slug_key" ON "authors"("slug");

-- CreateIndex
CREATE INDEX "authors_name_idx" ON "authors"("name");

-- CreateIndex
CREATE UNIQUE INDEX "works_slug_key" ON "works"("slug");

-- CreateIndex
CREATE INDEX "works_author_id_idx" ON "works"("author_id");

-- CreateIndex
CREATE INDEX "works_language_code_idx" ON "works"("language_code");

-- CreateIndex
CREATE INDEX "works_published_at_idx" ON "works"("published_at");

-- CreateIndex
CREATE INDEX "quotes_original_language_idx" ON "quotes"("original_language");

-- CreateIndex
CREATE INDEX "quotes_author_id_idx" ON "quotes"("author_id");

-- CreateIndex
CREATE INDEX "quotes_work_id_idx" ON "quotes"("work_id");

-- CreateIndex
CREATE INDEX "quotes_moderation_status_created_at_idx" ON "quotes"("moderation_status", "created_at");

-- CreateIndex
CREATE INDEX "quotes_verification_status_idx" ON "quotes"("verification_status");

-- CreateIndex
CREATE INDEX "quotes_difficulty_level_idx" ON "quotes"("difficulty_level");

-- CreateIndex
CREATE INDEX "quote_evidences_quote_id_idx" ON "quote_evidences"("quote_id");

-- CreateIndex
CREATE INDEX "quote_evidences_evidence_type_idx" ON "quote_evidences"("evidence_type");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- CreateIndex
CREATE INDEX "tags_tag_type_idx" ON "tags"("tag_type");

-- CreateIndex
CREATE INDEX "tags_parent_id_idx" ON "tags"("parent_id");

-- CreateIndex
CREATE INDEX "tags_name_idx" ON "tags"("name");

-- CreateIndex
CREATE INDEX "quote_tags_tag_id_idx" ON "quote_tags"("tag_id");

-- CreateIndex
CREATE INDEX "submissions_submitter_id_idx" ON "submissions"("submitter_id");

-- CreateIndex
CREATE INDEX "submissions_reviewed_by_id_idx" ON "submissions"("reviewed_by_id");

-- CreateIndex
CREATE INDEX "submissions_published_quote_id_idx" ON "submissions"("published_quote_id");

-- CreateIndex
CREATE INDEX "submissions_original_language_idx" ON "submissions"("original_language");

-- CreateIndex
CREATE INDEX "submissions_moderation_status_created_at_idx" ON "submissions"("moderation_status", "created_at");

-- CreateIndex
CREATE INDEX "submissions_verification_status_idx" ON "submissions"("verification_status");

-- CreateIndex
CREATE INDEX "submission_evidences_submission_id_idx" ON "submission_evidences"("submission_id");

-- CreateIndex
CREATE INDEX "submission_evidences_evidence_type_idx" ON "submission_evidences"("evidence_type");

-- CreateIndex
CREATE INDEX "favorites_quote_id_idx" ON "favorites"("quote_id");

-- CreateIndex
CREATE INDEX "reports_reporter_user_id_idx" ON "reports"("reporter_user_id");

-- CreateIndex
CREATE INDEX "reports_quote_id_idx" ON "reports"("quote_id");

-- CreateIndex
CREATE INDEX "reports_submission_id_idx" ON "reports"("submission_id");

-- CreateIndex
CREATE INDEX "reports_status_created_at_idx" ON "reports"("status", "created_at");

-- AddForeignKey
ALTER TABLE "works" ADD CONSTRAINT "works_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "works" ADD CONSTRAINT "works_language_code_fkey" FOREIGN KEY ("language_code") REFERENCES "languages"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_original_language_fkey" FOREIGN KEY ("original_language") REFERENCES "languages"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "works"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_evidences" ADD CONSTRAINT "quote_evidences_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "tags"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_tags" ADD CONSTRAINT "quote_tags_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_tags" ADD CONSTRAINT "quote_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_submitter_id_fkey" FOREIGN KEY ("submitter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_original_language_fkey" FOREIGN KEY ("original_language") REFERENCES "languages"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_published_quote_id_fkey" FOREIGN KEY ("published_quote_id") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_evidences" ADD CONSTRAINT "submission_evidences_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

