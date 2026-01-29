-- AlterTable
ALTER TABLE "ai_feedbacks" ADD COLUMN     "attempt_id" TEXT;

-- AddForeignKey
ALTER TABLE "ai_feedbacks" ADD CONSTRAINT "ai_feedbacks_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "solution_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
