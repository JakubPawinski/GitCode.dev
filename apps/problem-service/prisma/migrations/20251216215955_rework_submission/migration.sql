/*
  Warnings:

  - You are about to drop the column `accepted_at` on the `user_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `user_submissions` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "user_submissions_accepted_at_idx";

-- DropIndex
DROP INDEX "user_submissions_status_idx";

-- AlterTable
ALTER TABLE "user_submissions" DROP COLUMN "accepted_at",
DROP COLUMN "status",
ADD COLUMN     "first_attempt_at" TIMESTAMP(3),
ADD COLUMN     "is_solved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "solved_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "user_submissions_is_solved_idx" ON "user_submissions"("is_solved");
