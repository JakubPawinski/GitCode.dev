import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { Inject, Logger } from '@nestjs/common';
import { DockerExecutorService } from './docker-executor.service';
import { SubmissionGateway } from './submission.gateway';
import { AttemptStatus } from './enum';
import { EventBus } from '@gitcode/messaging';
import {
  SUBMISSION_PATTERNS,
  SubmissionCompletedEvent,
  SubmissionFailedEvent,
} from '@gitcode/contracts';
import { TokenName } from '../shared/token-name.enum.ts';
import { PrismaClient } from '@prisma/client-problem';
@Processor('submissions')
export class SubmissionProcessor extends WorkerHost {
  private readonly logger = new Logger(SubmissionProcessor.name);

  constructor(
    @Inject(TokenName.PRISMA_PROBLEM) private prismaConnectionService: PrismaClient,
    private codeExecutor: DockerExecutorService,
    private submissionGateway: SubmissionGateway,
    private eventBus: EventBus,
  ) {
    super();
    this.logger.log('SubmissionProcessor initialized!');
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id}...`);

    const { attemptId, code, language, problemId, userId, submissionId } =
      job.data;

    try {
      // Update status
      await this.prismaConnectionService.solutionAttempt.update({
        where: { id: attemptId },
        data: { status: AttemptStatus.RUNNING },
      });

      this.logger.log(`Sending 'running' event to user ${userId}`);
      this.submissionGateway.notifyAttemptUpdate(userId, attemptId, {
        status: AttemptStatus.RUNNING,
        message: 'Running tests...',
      });

      // Get test cases for this problem
      const testCases = await this.prismaConnectionService.testCase.findMany({
        where: { problemId },
        orderBy: { orderIndex: 'asc' },
      });

      // Execute code against test cases
      const results = await this.codeExecutor.executeCodeBatch(
        code,
        language,
        testCases,
      );

      // Save test results
      let passedTests = 0;
      let failedTests = 0;
      let totalExecutionTime = 0;
      const failedTestDetails: any[] = [];

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const testCase = testCases[i];

        await this.prismaConnectionService.testResult.create({
          data: {
            attemptId,
            testCaseId: testCase.id,
            testIndex: i,
            passed: result.passed,
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            actualOutput: result.output,
            errorMessage: result.errorMessage,
          },
        });

        if (result.passed) passedTests++;
        else {
          failedTests++;
          failedTestDetails.push({
            testIndex: i,
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            actualOutput: result.output,
            errorMessage: result.errorMessage,
            executionTime: result.executionTime,
          });

          // OPTIONAL! Notify user about every failed test(a lot of traffic some problems have over 100 test cases)
          // this.submissionGateway.notifyTestResult(userId, attemptId, {
          //   testIndex: i,
          //   passed: false,
          //   input: testCase.input,
          //   expectedOutput: testCase.expectedOutput,
          //   actualOutput: result.output,
          //   errorMessage: result.errorMessage,
          // });
        }

        totalExecutionTime += result.executionTime || 0;
      }

      const avgExecutionTime =
        results.length > 0
          ? Math.round((totalExecutionTime / results.length) * 100) / 100
          : 0;

      const isAllPassed = passedTests === results.length;
      const status = isAllPassed ? AttemptStatus.SUCCESS : AttemptStatus.FAILED;

      // If all tests passed, publish submission completed event
      if (isAllPassed) {
        this.logger.log(`Attempt ${attemptId} passed all tests!`);
        this.logger.log(
          `Sending 'submission-completed' event to user ${userId}`,
        );

        const problemDescription: string = await this.prismaConnectionService.problem
          .findUnique({
            where: { id: problemId },
            select: { description: true },
          })
          .then((problem) => problem?.description || '');

        // Sending submission completed event
        await this.eventBus.publish(
          SUBMISSION_PATTERNS.SUBMISSION_COMPLETED,
          new SubmissionCompletedEvent(
            userId,
            submissionId,
            code,
            language,
            problemId,
            attemptId,
            problemDescription,
          ),
        );
        this.logger.log(
          `'submission-completed' event sent for submission ${submissionId}`,
        );
      }
      
      // If some tests failed, publish submission failed event
      if (!isAllPassed) {
        this.logger.log(`Attempt ${attemptId} failed some tests!`);
        this.logger.log(`Sending 'submission-failed' event to user ${userId}`);

        const problemDescription: string = await this.prismaConnectionService.problem
          .findUnique({
            where: { id: problemId },
            select: { description: true },
          })
          .then((problem) => problem?.description || '');

        // Sending submission failed event
        await this.eventBus.publish(
          SUBMISSION_PATTERNS.SUBMISSION_FAILED,
          new SubmissionFailedEvent(
            userId,
            submissionId,
            code,
            language,
            problemId,
            attemptId,
            problemDescription,
          ),
        );
        this.logger.log(
          `'submission-failed' event sent for submission ${submissionId}`,
        );
      }

      // Update attempt with results
      await this.prismaConnectionService.solutionAttempt.update({
        where: { id: attemptId },
        data: {
          status,
          passedTests,
          failedTests,
          totalTests: results.length,
          executionTime: avgExecutionTime,
          completedAt: new Date(),
        },
      });

      // Get current submission to check if already accepted
      const currentSubmission = await this.prismaConnectionService.userSubmission.findUnique({
        where: { id: submissionId },
        select: { isSolved: true, solvedAt: true, submittedAt: true },
      });

      // Update user submission
      await this.prismaConnectionService.userSubmission.update({
        where: { id: submissionId },
        data: {
          isSolved: isAllPassed || currentSubmission?.isSolved,
          solvedAt:
            isAllPassed && !currentSubmission?.solvedAt
              ? new Date()
              : currentSubmission?.solvedAt,
          lastAttemptId: attemptId,
          passedTestCases: passedTests,
          totalTestCases: results.length,
          submittedAt: currentSubmission?.submittedAt || new Date(),
        },
      });

      // Get current problem stats
      const stats = await this.prismaConnectionService.problemStats.findUnique({
        where: { problemId },
      });

      // Update based on results
      const newTotal = (stats?.totalSubmissions || 0) + 1;
      const newAccepted =
        (stats?.acceptedSubmissions || 0) + (isAllPassed ? 1 : 0);
      const newAcceptanceRate = (newAccepted / newTotal) * 100;
      const newAvgTime =
        ((stats?.avgExecutionTime || 0) * (stats?.totalSubmissions || 0) +
          avgExecutionTime) /
        newTotal;

      // Upsert in db
      await this.prismaConnectionService.problemStats.upsert({
        where: { problemId },
        create: {
          problemId,
          totalSubmissions: 1,
          acceptedSubmissions: isAllPassed ? 1 : 0,
          acceptanceRate: isAllPassed ? 100 : 0,
          avgExecutionTime: avgExecutionTime,
        },
        update: {
          totalSubmissions: newTotal,
          acceptedSubmissions: newAccepted,
          acceptanceRate: newAcceptanceRate,
          avgExecutionTime: newAvgTime,
        },
      });

      this.logger.log(`Sending 'completed' event to user ${userId}`);
      // Notify about process end with details
      this.submissionGateway.notifyAttemptUpdate(userId, attemptId, {
        status,
        passedTests,
        failedTests,
        totalTests: results.length,
        executionTime: avgExecutionTime,
        message: isAllPassed
          ? 'All tests passed!'
          : `${failedTests} tests did not pass`,
        failedTestsDetails: failedTestDetails,
      });
      this.logger.log(
        `Attempt ${attemptId} completed: ${passedTests}/${results.length} tests passed`,
      );
      return {
        success: true,
        passedTests,
        failedTests,
        executionTime: avgExecutionTime,
      };
    } catch (error) {
      this.logger.error(`Job ${job.id} failed:`, error);

      await this.prismaConnectionService.solutionAttempt.update({
        where: { id: attemptId },
        data: {
          status: AttemptStatus.ERROR,
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      });

      // Update user submission on error
      await this.prismaConnectionService.userSubmission.update({
        where: { id: submissionId },
        data: {
          lastAttemptId: attemptId,
        },
      });

      // Notify about errors
      this.submissionGateway.notifyAttemptUpdate(userId, attemptId, {
        status: AttemptStatus.ERROR,
        message: 'Error running code',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }
}
