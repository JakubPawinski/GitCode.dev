-- AlterTable
ALTER TABLE "commits" ADD COLUMN     "submission_id" TEXT;

-- CreateIndex
CREATE INDEX "commits_submission_id_idx" ON "commits"("submission_id");
