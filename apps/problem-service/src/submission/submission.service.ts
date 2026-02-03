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
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bull';
import { SubmissionGateway } from './submission.gateway';
import { PaginationQueryDto } from '@gitcode/common';
import { PaginatedResult } from '@gitcode/types';
import { AttemptStatus } from './enum';
import {
  SubmissionAnalyzedEvent,
  FileCommittedEvent,
} from '@gitcode/contracts';
import {
  UserStatsExtendedDto,
  DifficultyBreakdownDto,
  DifficultyPercentageDto,
  TopicStatsDto,
  LanguageStatsDto,
  StreakDto,
  ActivityHeatmapDto,
  WeeklyActivityDto,
  HourlyActivityDto,
  AIFeedbackStatsDto,
  AIFeedbackSeverityDto,
  PerformanceMetricsDto,
  ProgressOverTimeDto,
  StrengthWeaknessDto,
  MilestoneDto,
  RecentActivityDto,
} from './dto/user-stats-extended.dto';

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
        updatedAt: new Date(),
      },
      create: {
        userId,
        problemId: createSubmissionDto.problemId,
        currentCode: createSubmissionDto.code,
        currentLanguage: createSubmissionDto.language.toLocaleLowerCase(),
        isSolved: false,
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
        status: AttemptStatus.PENDING,
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
        submissionId: userSubmission.id,
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
        feedbacks: true,
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

    // Check if attempt exists
    if (!attempt) {
      throw new NotFoundException(`Attempt ${attemptId} not found`);
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
      feedbacks: attempt.feedbacks.length > 0 ? attempt.feedbacks[0] : null,
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
    paginationDto: PaginationQueryDto,
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
        isSolved: sub.isSolved,
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
      meta: {
        currentPage: page,
        pageSize: limit,
        totalItems: total,
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
      (a) => a.status === AttemptStatus.SUCCESS,
    );
    const problemsSolved = submissions.filter((s) => s.isSolved).length;

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
      isSolved: submission.isSolved,
      currentCode: submission.currentCode,
      currentLanguage: submission.currentLanguage,
      totalTestCases: submission.totalTestCases,
      githubUrl: submission.githubUrl,
      commitHash: submission.commitHash,
      solvedAt: submission.solvedAt,
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

  /**
   * Handle AI analysis result for a submission
   * @param submissionId - ID of the submission
   * @param payload - Analysis result payload
   * @returns void
   */
  public async handleAiAnalysisResult(
    submissionId: string,
    payload: SubmissionAnalyzedEvent,
  ) {
    this.logger.log(
      `Handling AI analysis result for submission ${submissionId}`,
    );

    const submission = await this.prisma.userSubmission.findUnique({
      where: { id: submissionId },
      select: { userId: true },
    });

    // Check if submission exists
    if (!submission) {
      this.logger.error(`Submission ${submissionId} not found for AI analysis`);
      return;
    }

    // Store AI analysis feedback in database
    await this.prisma.aIFeedback.create({
      data: {
        submissionId,
        attemptId: payload.attemptId,
        content: payload.content,
        feedbackType: payload.feedbackType,
        severity: payload.severity,
        createdAt: new Date(),
      },
    });
    this.logger.log(
      `Stored AI analysis feedback for submission ${submissionId} in database`,
    );

    // Notify user via WebSocket
    this.submissionGateway.notifySubmissionAnalyzed(
      submission.userId,
      submissionId,
      {
        content: payload.content,
        feedbackType: payload.feedbackType,
        severity: payload.severity,
      },
      payload.attemptId,
    );
  }

  public async handleFileCommitted(
    submissionId: string,
    payload: FileCommittedEvent,
  ) {
    if (!submissionId) {
      this.logger.warn('File committed without submissionId, skipping update');
      return;
    }

    try {
      await this.prisma.userSubmission.update({
        where: { id: submissionId },
        data: {
          commitHash: payload.commitSha,
          githubUrl: payload.commitUrl,
        },
      });

      this.logger.log(
        `Updated submission ${submissionId} with commit ${payload.commitSha}`,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to update submission ${submissionId}: ${error.message}. Submission may not exist or commit is not related to a problem submission.`,
      );
    }
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

  /**
   * Get extended user statistics for README generation and charts
   * @param userId - ID of the user
   * @returns - Extended user statistics with all metrics
   */
  public async getUserStatsExtended(
    userId: string,
  ): Promise<UserStatsExtendedDto> {
    const now = new Date();
    const oneYearAgo = new Date(
      now.getFullYear() - 1,
      now.getMonth(),
      now.getDate(),
    );

    // Fetch all user submissions with related data
    const submissions = await this.prisma.userSubmission.findMany({
      where: { userId },
      include: {
        problem: {
          include: {
            topics: true,
          },
        },
        attempts: {
          include: {
            feedbacks: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        feedbacks: true,
      },
    });

    // Fetch all AI feedbacks for user
    const allFeedbacks = await this.prisma.aIFeedback.findMany({
      where: {
        submission: { userId },
      },
    });

    // Base statistics
    const allAttempts = submissions.flatMap((s) => s.attempts);
    const successfulAttempts = allAttempts.filter(
      (a) => a.status === AttemptStatus.SUCCESS,
    );
    const solvedSubmissions = submissions.filter((s) => s.isSolved);

    // Difficulty Breakdown
    const difficultyBreakdown =
      this.calculateDifficultyBreakdown(solvedSubmissions);
    const difficultyPercentage =
      this.calculateDifficultyPercentage(difficultyBreakdown);

    // Topic Stats
    const topicStats = this.calculateTopicStats(submissions);

    // Language Stats
    const languageStats = this.calculateLanguageStats(allAttempts);

    // Streak
    const streak = this.calculateStreak(allAttempts);

    // Activity Heatmap (last 365 days)
    const activityHeatmap = this.calculateActivityHeatmap(
      allAttempts,
      oneYearAgo,
    );

    //  Weekly Activity
    const weeklyActivity = this.calculateWeeklyActivity(allAttempts);

    //  Hourly Activity
    const hourlyActivity = this.calculateHourlyActivity(allAttempts);

    //  AI Feedback Stats
    const aiFeedbackByType = this.calculateAIFeedbackByType(allFeedbacks);
    const aiFeedbackBySeverity =
      this.calculateAIFeedbackBySeverity(allFeedbacks);

    // Performance Metrics
    const performanceMetrics =
      this.calculatePerformanceMetrics(successfulAttempts);

    // Progress Over Time (last 12 months)
    const progressOverTime = this.calculateProgressOverTime(
      allAttempts,
      solvedSubmissions,
    );

    // Strengths & Weaknesses
    const strengthsWeaknesses = this.analyzeStrengthsWeaknesses(topicStats);

    // Milestones
    const milestones = this.calculateMilestones(
      solvedSubmissions.length,
      allAttempts.length,
      streak,
      difficultyBreakdown,
    );

    // Recent Activity
    const recentActivity = this.getRecentActivity(allAttempts.slice(0, 10));

    // Computed Metrics
    const averageDifficultyScore =
      this.calculateAverageDifficulty(solvedSubmissions);
    const consistencyScore = this.calculateConsistencyScore(
      activityHeatmap,
      streak,
    );
    const growthRate = this.calculateGrowthRate(progressOverTime);

    return {
      userId,
      problemsAttempted: submissions.length,
      problemsSolved: solvedSubmissions.length,
      totalSubmissions: allAttempts.length,
      successfulSubmissions: successfulAttempts.length,
      successRate:
        allAttempts.length > 0
          ? Math.round(
              (successfulAttempts.length / allAttempts.length) * 1000,
            ) / 10
          : 0,
      difficultyBreakdown,
      difficultyPercentage,
      topicStats,
      languageStats,
      streak,
      activityHeatmap,
      weeklyActivity,
      hourlyActivity,
      aiFeedbackByType,
      aiFeedbackBySeverity,
      performanceMetrics,
      progressOverTime,
      strengthsWeaknesses,
      milestones,
      recentActivity,
      averageDifficultyScore,
      consistencyScore,
      growthRate,
      generatedAt: new Date(),
    };
  }

  /**
   * Calculate difficulty breakdown from solved submissions
   * @param solvedSubmissions - Array of solved submissions
   * @returns - Difficulty breakdown DTO
   */
  private calculateDifficultyBreakdown(
    solvedSubmissions: any[],
  ): DifficultyBreakdownDto {
    const easy = solvedSubmissions.filter(
      (s) => s.problem.difficulty === 'EASY',
    ).length;
    const medium = solvedSubmissions.filter(
      (s) => s.problem.difficulty === 'MEDIUM',
    ).length;
    const hard = solvedSubmissions.filter(
      (s) => s.problem.difficulty === 'HARD',
    ).length;

    return {
      easy,
      medium,
      hard,
      total: easy + medium + hard,
    };
  }

  /**
   * Calculate difficulty percentage from breakdown
   * @param breakdown - Difficulty breakdown DTO
   * @returns - Difficulty percentage DTO
   */
  private calculateDifficultyPercentage(
    breakdown: DifficultyBreakdownDto,
  ): DifficultyPercentageDto {
    const total = breakdown.total || 1; // Avoid division by zero
    return {
      easy: Math.round((breakdown.easy / total) * 1000) / 10,
      medium: Math.round((breakdown.medium / total) * 1000) / 10,
      hard: Math.round((breakdown.hard / total) * 1000) / 10,
    };
  }

  /**
   * Calculate topic statistics from submissions
   * @param submissions - Array of user submissions
   * @returns - Array of topic statistics DTO
   */
  private calculateTopicStats(submissions: any[]): TopicStatsDto[] {
    const topicMap = new Map<
      string,
      {
        solved: number;
        attempted: number;
        executionTimes: number[];
      }
    >();

    for (const sub of submissions) {
      for (const topicRel of sub.problem.topics) {
        const topic = topicRel.topic;
        if (!topicMap.has(topic)) {
          topicMap.set(topic, { solved: 0, attempted: 0, executionTimes: [] });
        }
        const stats = topicMap.get(topic)!;
        stats.attempted++;
        if (sub.isSolved) {
          stats.solved++;
        }
        // Collect execution times from successful attempts
        const successfulAttempts = sub.attempts.filter(
          (a: any) => a.status === AttemptStatus.SUCCESS && a.executionTime,
        );
        stats.executionTimes.push(
          ...successfulAttempts.map((a: any) => a.executionTime),
        );
      }
    }

    return Array.from(topicMap.entries())
      .map(([topic, stats]) => ({
        topic,
        solved: stats.solved,
        attempted: stats.attempted,
        successRate:
          stats.attempted > 0
            ? Math.round((stats.solved / stats.attempted) * 1000) / 10
            : 0,
        avgExecutionTime:
          stats.executionTimes.length > 0
            ? Math.round(
                (stats.executionTimes.reduce((a, b) => a + b, 0) /
                  stats.executionTimes.length) *
                  10,
              ) / 10
            : null,
      }))
      .sort((a, b) => b.solved - a.solved);
  }

  /**
   * Calculate language statistics from attempts
   * @param attempts - Array of solution attempts
   * @returns - Array of language statistics DTO
   */
  private calculateLanguageStats(attempts: any[]): LanguageStatsDto[] {
    const langMap = new Map<
      string,
      {
        submissions: number;
        successful: number;
        executionTimes: number[];
        memoryUsages: number[];
      }
    >();

    for (const attempt of attempts) {
      const lang = attempt.language.toLowerCase();
      if (!langMap.has(lang)) {
        langMap.set(lang, {
          submissions: 0,
          successful: 0,
          executionTimes: [],
          memoryUsages: [],
        });
      }
      const stats = langMap.get(lang)!;
      stats.submissions++;
      if (attempt.status === AttemptStatus.SUCCESS) {
        stats.successful++;
        if (attempt.executionTime)
          stats.executionTimes.push(attempt.executionTime);
        if (attempt.memoryUsed) stats.memoryUsages.push(attempt.memoryUsed);
      }
    }

    return Array.from(langMap.entries())
      .map(([language, stats]) => ({
        language,
        submissions: stats.submissions,
        successful: stats.successful,
        successRate:
          stats.submissions > 0
            ? Math.round((stats.successful / stats.submissions) * 1000) / 10
            : 0,
        avgExecutionTime:
          stats.executionTimes.length > 0
            ? Math.round(
                (stats.executionTimes.reduce((a, b) => a + b, 0) /
                  stats.executionTimes.length) *
                  10,
              ) / 10
            : null,
        avgMemoryUsed:
          stats.memoryUsages.length > 0
            ? Math.round(
                (stats.memoryUsages.reduce((a, b) => a + b, 0) /
                  stats.memoryUsages.length) *
                  10,
              ) / 10
            : null,
      }))
      .sort((a, b) => b.submissions - a.submissions);
  }

  /**
   * Calculate current and longest streak from attempts
   * @param attempts - Array of solution attempts
   * @returns - Streak DTO
   */
  private calculateStreak(attempts: any[]): StreakDto {
    if (attempts.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        activeToday: false,
      };
    }

    // Get unique dates with activity
    const activityDates = new Set(
      attempts.map((a) => a.createdAt.toISOString().split('T')[0]),
    );
    const sortedDates = Array.from(activityDates).sort().reverse();

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split('T')[0];

    const activeToday = sortedDates[0] === today;
    const lastActivityDate = sortedDates[0] || null;

    // Calculate current streak
    let currentStreak = 0;
    let checkDate = activeToday ? today : yesterday;

    for (const date of sortedDates) {
      if (date === checkDate) {
        currentStreak++;
        checkDate = new Date(new Date(checkDate).getTime() - 86400000)
          .toISOString()
          .split('T')[0];
      } else if (date < checkDate) {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate: string | null = null;

    for (const date of sortedDates.reverse()) {
      if (!prevDate) {
        tempStreak = 1;
      } else {
        const diff =
          (new Date(date).getTime() - new Date(prevDate).getTime()) / 86400000;
        if (diff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      prevDate = date;
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      currentStreak,
      longestStreak,
      lastActivityDate,
      activeToday,
    };
  }

  /**
   * Calculate activity heatmap from attempts
   * @param attempts - Array of solution attempts
   * @param startDate - Start date for heatmap
   * @returns - Array of activity heatmap DTO
   */
  private calculateActivityHeatmap(
    attempts: any[],
    startDate: Date,
  ): ActivityHeatmapDto[] {
    const heatmap = new Map<
      string,
      { submissions: number; solved: Set<string> }
    >();

    for (const attempt of attempts) {
      if (attempt.createdAt < startDate) continue;
      const date = attempt.createdAt.toISOString().split('T')[0];
      if (!heatmap.has(date)) {
        heatmap.set(date, { submissions: 0, solved: new Set() });
      }
      const day = heatmap.get(date)!;
      day.submissions++;
      if (attempt.status === AttemptStatus.SUCCESS) {
        day.solved.add(attempt.submissionId);
      }
    }

    return Array.from(heatmap.entries())
      .map(([date, data]) => ({
        date,
        submissions: data.submissions,
        solved: data.solved.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Calculate weekly activity from attempts
   * @param attempts - Array of solution attempts
   * @returns - Array of weekly activity DTO
   */
  private calculateWeeklyActivity(attempts: any[]): WeeklyActivityDto[] {
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const weeklyMap = new Map<number, { total: number; successful: number }>();

    for (let i = 0; i < 7; i++) {
      weeklyMap.set(i, { total: 0, successful: 0 });
    }

    for (const attempt of attempts) {
      const day = attempt.createdAt.getDay();
      const stats = weeklyMap.get(day)!;
      stats.total++;
      if (attempt.status === AttemptStatus.SUCCESS) {
        stats.successful++;
      }
    }

    return Array.from(weeklyMap.entries()).map(([dayOfWeek, stats]) => ({
      dayOfWeek,
      dayName: dayNames[dayOfWeek],
      totalSubmissions: stats.total,
      successfulSubmissions: stats.successful,
    }));
  }

  /**
   * Calculate hourly activity from attempts
   * @param attempts - Array of solution attempts
   * @returns - Array of hourly activity DTO
   */
  private calculateHourlyActivity(attempts: any[]): HourlyActivityDto[] {
    const hourlyMap = new Map<number, number>();

    for (let i = 0; i < 24; i++) {
      hourlyMap.set(i, 0);
    }

    for (const attempt of attempts) {
      const hour = attempt.createdAt.getHours();
      hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
    }

    return Array.from(hourlyMap.entries()).map(([hour, submissions]) => ({
      hour,
      submissions,
    }));
  }

  /**
   * Calculate AI feedback statistics by type
   * @param feedbacks - Array of AI feedbacks
   * @returns - AI feedback statistics DTO
   */
  private calculateAIFeedbackByType(feedbacks: any[]): AIFeedbackStatsDto {
    const types = {
      bug: 0,
      performance: 0,
      security: 0,
      cleanCode: 0,
      logic: 0,
      bestPractices: 0,
    };

    for (const fb of feedbacks) {
      const type = fb.feedbackType?.toUpperCase();
      switch (type) {
        case 'BUG':
          types.bug++;
          break;
        case 'PERFORMANCE':
          types.performance++;
          break;
        case 'SECURITY':
          types.security++;
          break;
        case 'CLEAN_CODE':
          types.cleanCode++;
          break;
        case 'LOGIC':
          types.logic++;
          break;
        case 'BEST_PRACTICES':
          types.bestPractices++;
          break;
      }
    }

    return {
      ...types,
      total: feedbacks.length,
    };
  }

  /**
   * Calculate AI feedback statistics by severity
   * @param feedbacks - Array of AI feedbacks
   * @returns - AI feedback severity DTO
   */
  private calculateAIFeedbackBySeverity(
    feedbacks: any[],
  ): AIFeedbackSeverityDto {
    const severity = { info: 0, warning: 0, critical: 0 };

    for (const fb of feedbacks) {
      const sev = fb.severity?.toUpperCase();
      switch (sev) {
        case 'INFO':
          severity.info++;
          break;
        case 'WARNING':
          severity.warning++;
          break;
        case 'CRITICAL':
          severity.critical++;
          break;
      }
    }

    return severity;
  }

  /**
   * Calculate performance metrics from successful attempts
   * @param successfulAttempts - Array of successful solution attempts
   * @returns - Performance metrics DTO
   */
  private calculatePerformanceMetrics(
    successfulAttempts: any[],
  ): PerformanceMetricsDto {
    const executionTimes = successfulAttempts
      .map((a) => a.executionTime)
      .filter((t): t is number => t !== null);
    const memoryUsages = successfulAttempts
      .map((a) => a.memoryUsed)
      .filter((m): m is number => m !== null);

    return {
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
      bestExecutionTime:
        executionTimes.length > 0 ? Math.min(...executionTimes) : null,
      bestMemoryUsed:
        memoryUsages.length > 0 ? Math.min(...memoryUsages) : null,
      executionTimePercentile: null,
      memoryPercentile: null,
    };
  }

  /**
   * Calculate progress over time from attempts
   * @param attempts - Array of solution attempts
   * @param solvedSubmissions - Array of solved submissions
   * @returns - Array of progress over time DTO
   */
  private calculateProgressOverTime(
    attempts: any[],
    solvedSubmissions: any[],
  ): ProgressOverTimeDto[] {
    const monthlyMap = new Map<
      string,
      { solved: Set<string>; submissions: number; successful: number }
    >();

    // Last 12 months
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(month, {
        solved: new Set(),
        submissions: 0,
        successful: 0,
      });
    }

    for (const attempt of attempts) {
      const month = `${attempt.createdAt.getFullYear()}-${String(attempt.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap.has(month)) {
        const stats = monthlyMap.get(month)!;
        stats.submissions++;
        if (attempt.status === AttemptStatus.SUCCESS) {
          stats.successful++;
          stats.solved.add(attempt.submissionId);
        }
      }
    }

    return Array.from(monthlyMap.entries()).map(([month, stats]) => ({
      month,
      problemsSolved: stats.solved.size,
      submissions: stats.submissions,
      successRate:
        stats.submissions > 0
          ? Math.round((stats.successful / stats.submissions) * 1000) / 10
          : 0,
    }));
  }

  /**
   * Analyze strengths and weaknesses from topic statistics
   * @param topicStats - Array of topic statistics DTO
   * @returns - Strengths and weaknesses DTO
   */
  private analyzeStrengthsWeaknesses(
    topicStats: TopicStatsDto[],
  ): StrengthWeaknessDto {
    const sorted = [...topicStats].filter((t) => t.attempted >= 2);

    // Strengths: top 3 topics by success rate (minimum 3 attempts)
    const strengths = sorted
      .filter((t) => t.attempted >= 3)
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 3)
      .map((t) => t.topic);

    // Weaknesses: bottom 3 topics by success rate
    const weaknesses = sorted
      .sort((a, b) => a.successRate - b.successRate)
      .slice(0, 3)
      .map((t) => t.topic);

    // Recommended: topics with low attempts but exist in platform
    const recommendedTopics = sorted
      .filter((t) => t.attempted < 5 && t.successRate < 70)
      .slice(0, 3)
      .map((t) => t.topic);

    return { strengths, weaknesses, recommendedTopics };
  }

  /**
   * Calculate milestones based on user activity
   * @param solved - Number of problems solved
   * @param attempts - Number of attempts made
   * @param streak - User streak DTO
   * @param difficulty - Difficulty breakdown DTO
   * @returns - Array of milestone DTO
   */
  private calculateMilestones(
    solved: number,
    attempts: number,
    streak: StreakDto,
    difficulty: DifficultyBreakdownDto,
  ): MilestoneDto[] {
    const milestones: MilestoneDto[] = [
      {
        id: 'first_solve',
        name: 'First Blood',
        description: 'Solve your first problem',
        achieved: solved >= 1,
        achievedAt: solved >= 1 ? new Date() : null,
        progress: Math.min(solved, 1),
        target: 1,
      },
      {
        id: 'solve_10',
        name: 'Getting Started',
        description: 'Solve 10 problems',
        achieved: solved >= 10,
        achievedAt: solved >= 10 ? new Date() : null,
        progress: Math.min(solved, 10),
        target: 10,
      },
      {
        id: 'solve_50',
        name: 'Problem Solver',
        description: 'Solve 50 problems',
        achieved: solved >= 50,
        achievedAt: solved >= 50 ? new Date() : null,
        progress: Math.min(solved, 50),
        target: 50,
      },
      {
        id: 'solve_100',
        name: 'Century Club',
        description: 'Solve 100 problems',
        achieved: solved >= 100,
        achievedAt: solved >= 100 ? new Date() : null,
        progress: Math.min(solved, 100),
        target: 100,
      },
      {
        id: 'hard_5',
        name: 'Hard Mode',
        description: 'Solve 5 hard problems',
        achieved: difficulty.hard >= 5,
        achievedAt: difficulty.hard >= 5 ? new Date() : null,
        progress: Math.min(difficulty.hard, 5),
        target: 5,
      },
      {
        id: 'streak_7',
        name: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        achieved: streak.longestStreak >= 7,
        achievedAt: streak.longestStreak >= 7 ? new Date() : null,
        progress: Math.min(streak.currentStreak, 7),
        target: 7,
      },
      {
        id: 'streak_30',
        name: 'Monthly Master',
        description: 'Maintain a 30-day streak',
        achieved: streak.longestStreak >= 30,
        achievedAt: streak.longestStreak >= 30 ? new Date() : null,
        progress: Math.min(streak.currentStreak, 30),
        target: 30,
      },
    ];

    return milestones;
  }

  /**
   * Get recent activity from attempts
   * @param attempts - Array of solution attempts
   * @returns - Array of recent activity DTO
   */
  private getRecentActivity(attempts: any[]): RecentActivityDto[] {
    return attempts.map((a) => ({
      problemId: a.submission?.problemId || '',
      problemTitle: a.submission?.problem?.title || 'Unknown',
      problemSlug: a.submission?.problem?.problemSlug || '',
      difficulty: a.submission?.problem?.difficulty || 'EASY',
      status: a.status,
      timestamp: a.createdAt,
    }));
  }

  /**
   * Calculate average difficulty score from solved submissions
   * @param solvedSubmissions - Array of solved submissions
   * @returns - Average difficulty score
   */
  private calculateAverageDifficulty(solvedSubmissions: any[]): number {
    if (solvedSubmissions.length === 0) return 0;

    const difficultyScore = {
      EASY: 1,
      MEDIUM: 2,
      HARD: 3,
    };

    const total = solvedSubmissions.reduce((sum, sub) => {
      return (
        sum +
        (difficultyScore[
          sub.problem.difficulty as keyof typeof difficultyScore
        ] || 1)
      );
    }, 0);

    return Math.round((total / solvedSubmissions.length) * 10) / 10;
  }

  /**
   * Calculate consistency score from activity heatmap and streak
   * @param heatmap - Array of activity heatmap DTO
   * @param streak - User streak DTO
   * @returns - Consistency score
   */
  private calculateConsistencyScore(
    heatmap: ActivityHeatmapDto[],
    streak: StreakDto,
  ): number {
    // Score based on: activity days in last 30 days + current streak weight
    const last30Days = heatmap.slice(-30);
    const activeDays = last30Days.filter((d) => d.submissions > 0).length;
    const streakBonus = Math.min(streak.currentStreak * 2, 30);

    return Math.min(Math.round((activeDays / 30) * 70 + streakBonus), 100);
  }

  /**
   * Calculate growth rate from progress over time
   * @param progressOverTime - Array of progress over time DTO
   * @returns - Growth rate percentage
   */
  private calculateGrowthRate(progressOverTime: ProgressOverTimeDto[]): number {
    if (progressOverTime.length < 2) return 0;

    const lastMonth = progressOverTime[progressOverTime.length - 1];
    const prevMonth = progressOverTime[progressOverTime.length - 2];

    if (prevMonth.problemsSolved === 0) {
      return lastMonth.problemsSolved > 0 ? 100 : 0;
    }

    return (
      Math.round(
        ((lastMonth.problemsSolved - prevMonth.problemsSolved) /
          prevMonth.problemsSolved) *
          1000,
      ) / 10
    );
  }
}
