import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateSubmissionDto, SubmissionHistoryDto } from './dto';
import {
  PaginatedResponseDto,
  PaginatedResult,
  PaginationDto,
} from 'src/problem/dto';
import { PrismaService } from 'src/prisma/prisma.service';
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

  async create(createSubmissionDto: CreateSubmissionDto, userId: string) {
    // Find problem from subbmison
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
    console.log(languages);
    if (!languages?.includes(createSubmissionDto.language.toLocaleLowerCase()))
      throw new BadRequestException(`Submission language not supported.`);

    // Create/Update user subbmision object in db
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
        currentLanguage: createSubmissionDto.language,
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
    this.logger.log(`📤 Adding job to queue for attempt ${attempt.id}`);

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

    this.logger.log(`✅ Job added to queue with ID: ${job.id}`);

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

  async getAttemptDetails(attemptId: string) {
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

  private async getQueueStats() {
    const activeCount = await this.submissionsQueue.getActiveCount();
    const waitingCount = await this.submissionsQueue.getWaitingCount();
    const total = activeCount + waitingCount;

    const estimatedWaitTime = waitingCount * 500; // ms estimation that the avg time of job is 500ms

    return {
      active: activeCount,
      waiting: waitingCount,
      total,
      position: activeCount,
      estimatedWaitTime,
    };
  }
}
