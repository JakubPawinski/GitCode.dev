import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateSubmissionDto,
  CreateSubmissionResponseDto,
  QueueStatsDto,
  RecentSubmissionDto,
  SubmissionDetailDto,
  SubmissionHistoryDto,
  SubmissionStatsDto,
  AttemptDetailsDto,
  DeleteResponseDto,
} from './dto';
import { PaginatedResult, PaginationDto } from '../problem/dto';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bull';
import { SubmissionGateway } from './submission.gateway';

@Injectable()
export class SubmissionService {
  private readonly logger = new Logger(SubmissionService.name);
  constructor(
    private prisma: PrismaService,
    @InjectQueue('submissions') private submissionsQueue: Queue,
    private submissionGateway: SubmissionGateway,
  ) {}

  async create(
    createSubmissionDto: CreateSubmissionDto,
    userId: string,
  ): Promise<CreateSubmissionResponseDto> {
    // Find problem from submisson
    const problem = await this.prisma.problem.findUnique({
      where: { id: createSubmissionDto.problemId },
      include: { testCases: true },
    });

    if (!problem) {
      throw new NotFoundException(
        `Problem with ID ${createSubmissionDto.problemId} does not exist in database.`,
      );
    }

    // Check if language is supported
    const languages = process.env.LANGUAGES_SUPPORTED?.split(',');
    if (!languages?.includes(createSubmissionDto.language.toLocaleLowerCase()))
      throw new BadRequestException(`Submission language not supported.`);

    // Create/Update user submission object in db
    const userSubmission = await this.prisma.userSubmission.upsert({
      where: {
        userId_problemId: {
          userId,
          problemId: createSubmissionDto.problemId,
        },
      },
      update: {
        currentCode: createSubmissionDto.code,
        currentLanguage: createSubmissionDto.language.toLocaleLowerCase(),
        status: 'in_progress',
        updatedAt: new Date(),
      },
      create: {
        userId,
        problemId: createSubmissionDto.problemId,
        currentCode: createSubmissionDto.code,
        currentLanguage: createSubmissionDto.language.toLocaleLowerCase(),
        status: 'in_progress',
        totalTestCases: problem.testCases.length,
      },
    });

    // Create new attempt object in db
    const attempt = await this.prisma.solutionAttempt.create({
      data: {
        submissionId: userSubmission.id,
        code: createSubmissionDto.code,
        language: createSubmissionDto.language,
        attemptNumber:
          (await this.prisma.solutionAttempt.count({
            where: { submissionId: userSubmission.id },
          })) + 1,
        status: 'pending',
        totalTests: problem.testCases.length,
      },
    });

    // DEBUG: Log before adding to queue
    this.logger.log(`Adding job to queue for attempt ${attempt.id}`);

    // Add to queue
    const job = await this.submissionsQueue.add(
      'process-submission',
      {
        attemptId: attempt.id,
        code: createSubmissionDto.code,
        language: createSubmissionDto.language.toLowerCase(),
        problemId: problem.id,
        userId,
      },
      {
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    this.logger.log(`Job added to queue with ID: ${job.id}`);

    const queueStats = await this.getQueueStats();

    // Send notification that the job is waiting in queue with data
    this.submissionGateway.notifyAttemptUpdate(userId, attempt.id, {
      status: 'queued',
      message: `Waiting in queue... (position: ${queueStats.position}/${queueStats.total})`,
      queuePosition: queueStats.position,
      queueSize: queueStats.total,
      estimatedWaitTime: queueStats.estimatedWaitTime,
    });

    return {
      ...attempt,
      queuePosition: queueStats.position,
      queueSize: queueStats.total,
      estimatedWaitTime: queueStats.estimatedWaitTime,
    };
  }

  async getAttemptDetails(attemptId: string): Promise<AttemptDetailsDto> {
    const attempt = await this.prisma.solutionAttempt.findUnique({
      where: { id: attemptId },
      include: {
        testResults: {
          orderBy: { testIndex: 'asc' },
          select: {
            id: true,
            testIndex: true,
            passed: true,
            input: true,
            expectedOutput: true,
            actualOutput: true,
            errorMessage: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new Error('Attempt not found');
    }
    const failedTests = attempt.testResults.filter((tr) => !tr.passed);
    return {
      id: attempt.id,
      status: attempt.status,
      passedTests: attempt.passedTests,
      failedTests: attempt.failedTests,
      totalTests: attempt.totalTests,
      executionTime: attempt.executionTime,
      memoryUsed: attempt.memoryUsed,
      createdAt: attempt.createdAt,
      completedAt: attempt.completedAt,
      // Test details
      testResults: attempt.testResults.map((tr) => ({
        testIndex: tr.testIndex,
        passed: tr.passed,
        input: JSON.parse(tr.input),
        expectedOutput: JSON.parse(tr.expectedOutput),
        actualOutput: tr.actualOutput ? JSON.parse(tr.actualOutput) : null,
        errorMessage: tr.errorMessage,
      })),
      // Only failed tests
      failedTestsDetails: failedTests.map((tr) => ({
        testIndex: tr.testIndex,
        passed: false,
        input: JSON.parse(tr.input),
        expectedOutput: JSON.parse(tr.expectedOutput),
        actualOutput: tr.actualOutput ? JSON.parse(tr.actualOutput) : null,
        errorMessage: tr.errorMessage,
      })),
    };
  }

  async getUserSubmissionHistory(
    userId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<SubmissionHistoryDto>> {
    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || 10;
    const sortBy = paginationDto.sortBy || 'createdAt';
    const sortOrder = paginationDto.sortOrder || 'desc';

    const where = { userId };

    const total = await this.prisma.userSubmission.count({ where });
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const submissions = await this.prisma.userSubmission.findMany({
      where,
      skip,
      take: +limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        problem: {
          select: {
            id: true,
            title: true,
            problemSlug: true,
            difficulty: true,
          },
        },
        attempts: {
          select: {
            status: true,
            executionTime: true,
            memoryUsed: true,
            passedTests: true,
            failedTests: true,
            totalTests: true,
            errorMessage: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const data: SubmissionHistoryDto[] = submissions.map((sub) => {
      const lastAttempt = sub.attempts[0];
      return {
        id: sub.id,
        userId: sub.userId,
        problemId: sub.problem.id,
        problemTitle: sub.problem.title,
        problemSlug: sub.problem.problemSlug,
        problemDifficulty: sub.problem.difficulty,
        status: sub.status,
        language: sub.currentLanguage,
        executionTime: lastAttempt?.executionTime || null,
        memoryUsed: lastAttempt?.memoryUsed || null,
        testResults: lastAttempt
          ? `${lastAttempt.passedTests}/${lastAttempt.totalTests} passed`
          : null,
        errorMessage: lastAttempt?.errorMessage || null,
        submittedAt: lastAttempt?.createdAt || sub.submittedAt || new Date(),
      };
    });

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async getUserStats(userId: string): Promise<SubmissionStatsDto> {
    const submissions = await this.prisma.userSubmission.findMany({
      where: { userId },
      include: {
        attempts: {
          select: {
            status: true,
            executionTime: true,
            memoryUsed: true,
          },
        },
      },
    });

    const allAttempts = submissions.flatMap((s) => s.attempts);
    const successfulAttempts = allAttempts.filter(
      (a) => a.status === 'success',
    );
    const problemsSolved = submissions.filter((s) =>
      s.attempts.some((a) => a.status === 'success'),
    ).length;

    const executionTimes = allAttempts
      .map((a) => a.executionTime)
      .filter((t): t is number => t !== null);
    const memoryUsages = allAttempts
      .map((a) => a.memoryUsed)
      .filter((m): m is number => m !== null);

    return {
      totalSubmissions: allAttempts.length,
      successfulSubmissions: successfulAttempts.length,
      successRate:
        allAttempts.length > 0
          ? Math.round(
              (successfulAttempts.length / allAttempts.length) * 100 * 10,
            ) / 10
          : 0,
      avgExecutionTime:
        executionTimes.length > 0
          ? Math.round(
              (executionTimes.reduce((a, b) => a + b, 0) /
                executionTimes.length) *
                10,
            ) / 10
          : null,
      avgMemoryUsed:
        memoryUsages.length > 0
          ? Math.round(
              (memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length) *
                10,
            ) / 10
          : null,
      problemsAttempted: submissions.length,
      problemsSolved,
    };
  }

  async getRecentSubmissions(
    userId: string,
    limit: number = 10,
  ): Promise<RecentSubmissionDto[]> {
    const attempts = await this.prisma.solutionAttempt.findMany({
      where: {
        submission: {
          userId,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 50), // Max 50
      include: {
        submission: {
          include: {
            problem: {
              select: {
                id: true,
                title: true,
                problemSlug: true,
                difficulty: true,
              },
            },
          },
        },
      },
    });

    return attempts.map((attempt) => ({
      attemptId: attempt.id,
      problemId: attempt.submission.problem.id,
      problemTitle: attempt.submission.problem.title,
      problemSlug: attempt.submission.problem.problemSlug,
      difficulty: attempt.submission.problem.difficulty,
      status: attempt.status,
      language: attempt.language,
      executionTime: attempt.executionTime,
      memoryUsed: attempt.memoryUsed,
      passedTests: attempt.passedTests,
      totalTests: attempt.totalTests,
      createdAt: attempt.createdAt,
    }));
  }

  async getSubmissionById(
    submissionId: string,
    userId: string,
  ): Promise<SubmissionDetailDto> {
    const submission = await this.prisma.userSubmission.findFirst({
      where: {
        id: submissionId,
        userId,
      },
      include: {
        problem: {
          select: {
            id: true,
            title: true,
            problemSlug: true,
            difficulty: true,
            description: true,
          },
        },
        attempts: {
          orderBy: { createdAt: 'desc' },
          include: {
            testResults: {
              orderBy: { testIndex: 'asc' },
            },
          },
        },
        feedbacks: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException(`Submission ${submissionId} not found`);
    }

    return {
      id: submission.id,
      problem: submission.problem,
      status: submission.status,
      currentCode: submission.currentCode,
      currentLanguage: submission.currentLanguage,
      totalTestCases: submission.totalTestCases,
      githubUrl: submission.githubUrl,
      commitHash: submission.commitHash,
      acceptedAt: submission.acceptedAt,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
      submittedAt: submission.submittedAt,
      attempts: submission.attempts.map((attempt) => ({
        id: attempt.id,
        attemptNumber: attempt.attemptNumber,
        status: attempt.status,
        code: attempt.code,
        language: attempt.language,
        executionTime: attempt.executionTime,
        memoryUsed: attempt.memoryUsed,
        passedTests: attempt.passedTests,
        failedTests: attempt.failedTests,
        totalTests: attempt.totalTests,
        errorMessage: attempt.errorMessage,
        createdAt: attempt.createdAt,
        completedAt: attempt.completedAt,
        testResults: attempt.testResults,
      })),
      feedbacks: submission.feedbacks,
    };
  }

  async deleteSubmission(
    submissionId: string,
    userId: string,
  ): Promise<DeleteResponseDto> {
    const submission = await this.prisma.userSubmission.findFirst({
      where: {
        id: submissionId,
        userId,
      },
    });

    if (!submission) {
      throw new NotFoundException(`Submission ${submissionId} not found`);
    }

    await this.prisma.userSubmission.delete({
      where: { id: submissionId },
    });

    return {
      message: 'Submission deleted successfully',
      deletedId: submissionId,
    };
  }

  private async getQueueStats(): Promise<QueueStatsDto> {
    const activeCount = await this.submissionsQueue.getActiveCount();
    const waitingCount = await this.submissionsQueue.getWaitingCount();
    const total = activeCount + waitingCount;

    const estimatedWaitTime = waitingCount * 500; // ms estimation that the avg time of job is 500ms

    return {
      active: activeCount,
      waiting: waitingCount,
      total,
      position: waitingCount + 1,
      estimatedWaitTime,
    };
  }
}
