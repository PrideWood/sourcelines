-- CreateTable
CREATE TABLE "submission_tags" (
    "submission_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "submission_tags_pkey" PRIMARY KEY ("submission_id","tag_id")
);

-- CreateIndex
CREATE INDEX "submission_tags_tag_id_idx" ON "submission_tags"("tag_id");

-- AddForeignKey
ALTER TABLE "submission_tags" ADD CONSTRAINT "submission_tags_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_tags" ADD CONSTRAINT "submission_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
