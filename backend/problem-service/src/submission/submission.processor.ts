import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DockerExecutorService } from './docker-executor.service';
import { SubmissionGateway } from './submission.gateway';

@Processor('submissions')
export class SubmissionProcessor extends WorkerHost {
  private readonly logger = new Logger(SubmissionProcessor.name);

  constructor(
    private prisma: PrismaService,
    private codeExecutor: DockerExecutorService,
    private submissionGateway: SubmissionGateway,
  ) {
    super();
    this.logger.log('SubmissionProcessor initialized!');
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id}...`);

    const { attemptId, code, language, problemId, userId } = job.data;

    try {
      // Update status
      await this.prisma.solutionAttempt.update({
        where: { id: attemptId },
        data: { status: 'running' },
      });

      this.logger.log(`Sending 'running' event to user ${userId}`);
      this.submissionGateway.notifyAttemptUpdate(userId, attemptId, {
        status: 'running',
        message: 'Running tests...',
      });

      // Get test cases for this problem
      const testCases = await this.prisma.testCase.findMany({
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

        await this.prisma.testResult.create({
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
      const status = isAllPassed ? 'succes' : 'failed';

      // Update attempt with results
      await this.prisma.solutionAttempt.update({
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

      await this.prisma.solutionAttempt.update({
        where: { id: attemptId },
        data: {
          status: 'error',
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      });

      // Notify about errors
      this.submissionGateway.notifyAttemptUpdate(userId, attemptId, {
        status: 'error',
        message: 'Error running code',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }
}
