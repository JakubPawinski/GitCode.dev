-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateTable
CREATE TABLE "problems" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "frontendId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "problemSlug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "solutions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "problems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problem_topics" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,

    CONSTRAINT "problem_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examples" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "exampleNum" INTEGER NOT NULL,
    "inputText" TEXT NOT NULL,
    "outputText" TEXT NOT NULL,
    "explanation" TEXT,
    "image_url" TEXT,

    CONSTRAINT "examples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "constraints" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "constraint" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "constraints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follow_ups" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hints" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "hintText" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "difficulty" TEXT,

    CONSTRAINT "hints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "code_snippets" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "starterCode" TEXT NOT NULL,

    CONSTRAINT "code_snippets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_cases" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "expected_output" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "test_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "similar_problems" (
    "id" TEXT NOT NULL,
    "problem_from_id" TEXT NOT NULL,
    "problem_to_id" TEXT NOT NULL,

    CONSTRAINT "similar_problems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_submissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "current_language" TEXT NOT NULL,
    "current_code" TEXT NOT NULL,
    "last_attempt_id" TEXT,
    "accepted_at" TIMESTAMP(3),
    "passed_test_cases" INTEGER NOT NULL DEFAULT 0,
    "total_test_cases" INTEGER NOT NULL,
    "commit_hash" TEXT,
    "github_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "submitted_at" TIMESTAMP(3),

    CONSTRAINT "user_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solution_attempts" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "execution_time" DOUBLE PRECISION,
    "memory_used" INTEGER,
    "error_message" TEXT,
    "passed_tests" INTEGER NOT NULL DEFAULT 0,
    "failed_tests" INTEGER NOT NULL DEFAULT 0,
    "total_tests" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "solution_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_results" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "testCaseId" TEXT NOT NULL,
    "test_index" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "input" TEXT NOT NULL,
    "expected_output" TEXT NOT NULL,
    "actual_output" TEXT,
    "error_message" TEXT,

    CONSTRAINT "test_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_feedbacks" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "feedbackType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "severity" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problem_stats" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "total_submissions" INTEGER NOT NULL DEFAULT 0,
    "accepted_submissions" INTEGER NOT NULL DEFAULT 0,
    "acceptance_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avg_execution_time" DOUBLE PRECISION,
    "avg_memory_used" DOUBLE PRECISION,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "problem_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "problems_problemId_key" ON "problems"("problemId");

-- CreateIndex
CREATE UNIQUE INDEX "problems_frontendId_key" ON "problems"("frontendId");

-- CreateIndex
CREATE UNIQUE INDEX "problems_problemSlug_key" ON "problems"("problemSlug");

-- CreateIndex
CREATE INDEX "problems_difficulty_idx" ON "problems"("difficulty");

-- CreateIndex
CREATE INDEX "problems_is_active_idx" ON "problems"("is_active");

-- CreateIndex
CREATE INDEX "problem_topics_problemId_idx" ON "problem_topics"("problemId");

-- CreateIndex
CREATE UNIQUE INDEX "problem_topics_problemId_topic_key" ON "problem_topics"("problemId", "topic");

-- CreateIndex
CREATE INDEX "examples_problemId_idx" ON "examples"("problemId");

-- CreateIndex
CREATE UNIQUE INDEX "examples_problemId_exampleNum_key" ON "examples"("problemId", "exampleNum");

-- CreateIndex
CREATE INDEX "constraints_problemId_idx" ON "constraints"("problemId");

-- CreateIndex
CREATE INDEX "follow_ups_problemId_idx" ON "follow_ups"("problemId");

-- CreateIndex
CREATE INDEX "hints_problemId_idx" ON "hints"("problemId");

-- CreateIndex
CREATE INDEX "code_snippets_problemId_idx" ON "code_snippets"("problemId");

-- CreateIndex
CREATE INDEX "code_snippets_language_idx" ON "code_snippets"("language");

-- CreateIndex
CREATE UNIQUE INDEX "code_snippets_problemId_language_key" ON "code_snippets"("problemId", "language");

-- CreateIndex
CREATE INDEX "test_cases_problemId_idx" ON "test_cases"("problemId");

-- CreateIndex
CREATE INDEX "test_cases_is_public_idx" ON "test_cases"("is_public");

-- CreateIndex
CREATE INDEX "similar_problems_problem_from_id_idx" ON "similar_problems"("problem_from_id");

-- CreateIndex
CREATE INDEX "similar_problems_problem_to_id_idx" ON "similar_problems"("problem_to_id");

-- CreateIndex
CREATE UNIQUE INDEX "similar_problems_problem_from_id_problem_to_id_key" ON "similar_problems"("problem_from_id", "problem_to_id");

-- CreateIndex
CREATE INDEX "user_submissions_userId_idx" ON "user_submissions"("userId");

-- CreateIndex
CREATE INDEX "user_submissions_problemId_idx" ON "user_submissions"("problemId");

-- CreateIndex
CREATE INDEX "user_submissions_status_idx" ON "user_submissions"("status");

-- CreateIndex
CREATE INDEX "user_submissions_accepted_at_idx" ON "user_submissions"("accepted_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_submissions_userId_problemId_key" ON "user_submissions"("userId", "problemId");

-- CreateIndex
CREATE INDEX "solution_attempts_submissionId_idx" ON "solution_attempts"("submissionId");

-- CreateIndex
CREATE INDEX "solution_attempts_status_idx" ON "solution_attempts"("status");

-- CreateIndex
CREATE INDEX "solution_attempts_created_at_idx" ON "solution_attempts"("created_at");

-- CreateIndex
CREATE INDEX "test_results_attemptId_idx" ON "test_results"("attemptId");

-- CreateIndex
CREATE INDEX "test_results_passed_idx" ON "test_results"("passed");

-- CreateIndex
CREATE INDEX "ai_feedbacks_submissionId_idx" ON "ai_feedbacks"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "problem_stats_problemId_key" ON "problem_stats"("problemId");

-- CreateIndex
CREATE INDEX "problem_stats_problemId_idx" ON "problem_stats"("problemId");

-- AddForeignKey
ALTER TABLE "problem_topics" ADD CONSTRAINT "problem_topics_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examples" ADD CONSTRAINT "examples_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "constraints" ADD CONSTRAINT "constraints_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hints" ADD CONSTRAINT "hints_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "code_snippets" ADD CONSTRAINT "code_snippets_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "similar_problems" ADD CONSTRAINT "similar_problems_problem_from_id_fkey" FOREIGN KEY ("problem_from_id") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "similar_problems" ADD CONSTRAINT "similar_problems_problem_to_id_fkey" FOREIGN KEY ("problem_to_id") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_submissions" ADD CONSTRAINT "user_submissions_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solution_attempts" ADD CONSTRAINT "solution_attempts_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "user_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "solution_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_feedbacks" ADD CONSTRAINT "ai_feedbacks_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "user_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem_stats" ADD CONSTRAINT "problem_stats_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
