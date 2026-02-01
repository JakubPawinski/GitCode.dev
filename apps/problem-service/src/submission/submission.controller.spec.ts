import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SubmissionController } from './submission.controller';
import { SubmissionService } from './submission.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { PaginationQueryDto } from '@gitcode/common';
import {
  SubmissionStatsDto,
  RecentSubmissionDto,
  SubmissionDetailDto,
  SubmissionHistoryDto,
  AttemptDetailsDto,
  DeleteResponseDto,
} from './dto';
import { UserStatsExtendedDto } from './dto/user-stats-extended.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('SubmissionController', () => {
  let controller: SubmissionController;
  let service: jest.Mocked<SubmissionService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUserId = 'user-123';

  const mockSubmissionStats: SubmissionStatsDto = {
    totalSubmissions: 42,
    successfulSubmissions: 28,
    successRate: 66.7,
    avgExecutionTime: 145.2,
    avgMemoryUsed: 51.5,
    problemsAttempted: 15,
    problemsSolved: 12,
  };

  const mockRecentSubmission: RecentSubmissionDto = {
    attemptId: 'attempt-1',
    problemId: 'problem-1',
    problemTitle: 'Two Sum',
    problemSlug: 'two-sum',
    difficulty: 'EASY',
    status: 'success',
    language: 'python',
    executionTime: 125.5,
    memoryUsed: 42.3,
    passedTests: 8,
    totalTests: 10,
    createdAt: new Date(),
  };

  const mockAttemptDetails: AttemptDetailsDto = {
    id: 'attempt-1',
    status: 'success',
    passedTests: 8,
    failedTests: 2,
    totalTests: 10,
    executionTime: 125.5,
    memoryUsed: 42.3,
    createdAt: new Date(),
    completedAt: new Date(),
    feedbacks: null,
    testResults: [
      {
        testIndex: 0,
        passed: true,
        input: { nums: [2, 7, 11, 15], target: 9 },
        expectedOutput: [0, 1],
        actualOutput: [0, 1],
        errorMessage: null,
      },
    ],
    failedTestsDetails: [],
  };

  const mockSubmissionDetail: SubmissionDetailDto = {
    id: 'submission-1',
    problem: {
      id: 'problem-1',
      title: 'Two Sum',
      problemSlug: 'two-sum',
      difficulty: 'EASY',
      description: 'Find two numbers that add up to target',
    },
    isSolved: true,
    currentCode: 'def twoSum(nums, target):\n    pass',
    currentLanguage: 'python',
    totalTestCases: 10,
    githubUrl: null,
    commitHash: null,
    solvedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    submittedAt: new Date(),
    attempts: [],
    feedbacks: [],
  };

  const mockSubmissionHistory: SubmissionHistoryDto = {
    id: 'submission-1',
    userId: mockUserId,
    problemId: 'problem-1',
    problemTitle: 'Two Sum',
    problemSlug: 'two-sum',
    problemDifficulty: 'EASY',
    isSolved: true,
    language: 'python',
    executionTime: 125.5,
    memoryUsed: 42.3,
    testResults: '8/10 passed',
    errorMessage: null,
    submittedAt: new Date(),
  };

    const mockUserStatsExtended: UserStatsExtendedDto = {
    userId: mockUserId,
    totalSubmissions: 42,
    successfulSubmissions: 28,
    successRate: 66.7,
    problemsAttempted: 15,
    problemsSolved: 12,
    difficultyBreakdown: {
      easy: 20,
      medium: 15,
      hard: 7,
      total: 42,
    },
    difficultyPercentage: {
      easy: 47.6,
      medium: 35.7,
      hard: 16.7,
    },
    topicStats: [
      {
        topic: 'Array',
        solved: 8,
        attempted: 10,
        successRate: 80,
        avgExecutionTime: 125.5,
      },
    ],
    languageStats: [
      {
        language: 'python',
        submissions: 25,
        successful: 20,
        successRate: 80,
        avgExecutionTime: 140,
        avgMemoryUsed: 50,
      },
    ],
    streak: {
      currentStreak: 5,
      longestStreak: 15,
      lastActivityDate: '2024-01-15',
      activeToday: true,
    },
    activityHeatmap: [],
    weeklyActivity: [
      {
        dayOfWeek: 0,
        dayName: 'Sunday',
        totalSubmissions: 5,
        successfulSubmissions: 4,
      },
    ],
    hourlyActivity: [],
    aiFeedbackByType: {
      bug: 5,
      performance: 3,
      security: 2,
      cleanCode: 8,
      logic: 4,
      bestPractices: 3,
      total: 25,
    },
    aiFeedbackBySeverity: {
      info: 15,
      warning: 8,
      critical: 2,
    },
    performanceMetrics: {
      avgExecutionTime: 145.2,
      avgMemoryUsed: 51.5,
      bestExecutionTime: 100,
      bestMemoryUsed: 35,
      executionTimePercentile: 75,
      memoryPercentile: 70,
    },
    progressOverTime: [],
    strengthsWeaknesses: {
      strengths: ['Array', 'String'],
      weaknesses: ['Graph', 'DP'],
      recommendedTopics: ['Dynamic Programming'],
    },
    milestones: [],
    recentActivity: [],
    averageDifficultyScore: 1.5,
    consistencyScore: 75,
    growthRate: 15.5,
    generatedAt: new Date(),
  };

  const mockPaginationDto: PaginationQueryDto = {
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  };

  beforeEach(async () => {
    const mockSubmissionService = {
      create: jest.fn(),
      getUserSubmissionHistory: jest.fn(),
      getAttemptDetails: jest.fn(),
      getUserStats: jest.fn(),
      getUserStatsExtended: jest.fn(),
      getRecentSubmissions: jest.fn(),
      getSubmissionById: jest.fn(),
      deleteSubmission: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
      getOrThrow: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubmissionController],
      providers: [
        {
          provide: SubmissionService,
          useValue: mockSubmissionService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<SubmissionController>(SubmissionController);
    service = module.get(SubmissionService) as jest.Mocked<SubmissionService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new submission', async () => {
      // Arrange
      const createSubmissionDto: CreateSubmissionDto = {
        problemId: 'problem-1',
        code: 'def twoSum(nums, target):\n    pass',
        language: 'python',
      };

      const mockResponse = {
        id: 'attempt-1',
        submissionId: 'submission-1',
        status: 'pending',
        attemptNumber: 1,
        queuePosition: 2,
        queueSize: 5,
        estimatedWaitTime: 2500,
        createdAt: new Date(),
      };

      service.create.mockResolvedValue(mockResponse as any);

      // Act
      const result = await controller.create(createSubmissionDto, {
        id: mockUserId,
      } as any);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(service.create).toHaveBeenCalledWith(
        createSubmissionDto,
        mockUserId,
      );
    });

    it('should throw BadRequestException for unsupported language', async () => {
      // Arrange
      const createSubmissionDto: CreateSubmissionDto = {
        problemId: 'problem-1',
        code: 'code',
        language: 'unsupported',
      };

      service.create.mockRejectedValue(
        new BadRequestException('Submission language not supported'),
      );

      // Act & Assert
      await expect(
        controller.create(createSubmissionDto, { id: mockUserId } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if problem does not exist', async () => {
      // Arrange
      const createSubmissionDto: CreateSubmissionDto = {
        problemId: 'nonexistent',
        code: 'code',
        language: 'python',
      };

      service.create.mockRejectedValue(
        new NotFoundException(
          'Problem with ID nonexistent does not exist in database',
        ),
      );

      // Act & Assert
      await expect(
        controller.create(createSubmissionDto, { id: mockUserId } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserHistory', () => {
    it('should return paginated submission history', async () => {
      // Arrange
      const mockResponse = {
        data: [mockSubmissionHistory],
        meta: {
          currentPage: 1,
          pageSize: 10,
          totalItems: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      service.getUserSubmissionHistory.mockResolvedValue(mockResponse as any);

      // Act
      const result = await controller.getUserHistory(
        { id: mockUserId } as any,
        mockPaginationDto,
      );

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.meta.currentPage).toBe(1);
      expect(service.getUserSubmissionHistory).toHaveBeenCalledWith(
        mockUserId,
        mockPaginationDto,
      );
    });

    it('should handle empty submission history', async () => {
      // Arrange
      const mockResponse = {
        data: [],
        meta: {
          currentPage: 1,
          pageSize: 10,
          totalItems: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      service.getUserSubmissionHistory.mockResolvedValue(mockResponse as any);

      // Act
      const result = await controller.getUserHistory(
        { id: mockUserId } as any,
        mockPaginationDto,
      );

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.meta.totalItems).toBe(0);
    });

    it('should apply pagination correctly', async () => {
      // Arrange
      const paginationDto: PaginationQueryDto = {
        page: 2,
        limit: 20,
        sortBy: 'submittedAt',
        sortOrder: 'asc',
      };

      service.getUserSubmissionHistory.mockResolvedValue({
        data: [],
        meta: {
          currentPage: 2,
          pageSize: 20,
          totalItems: 40,
          totalPages: 2,
          hasNextPage: false,
          hasPreviousPage: true,
        },
      } as any);

      // Act
      const result = await controller.getUserHistory(
        { id: mockUserId } as any,
        paginationDto,
      );

      // Assert
      expect(result.meta.currentPage).toBe(2);
      expect(result.meta.pageSize).toBe(20);
      expect(service.getUserSubmissionHistory).toHaveBeenCalledWith(
        mockUserId,
        paginationDto,
      );
    });
  });

  describe('getAttemptDetails', () => {
    it('should return attempt details', async () => {
      // Arrange
      service.getAttemptDetails.mockResolvedValue(mockAttemptDetails);

      // Act
      const result = await controller.getAttemptDetails('attempt-1');

      // Assert
      expect(result).toEqual(mockAttemptDetails);
      expect(result.id).toBe('attempt-1');
      expect(result.passedTests).toBe(8);
      expect(service.getAttemptDetails).toHaveBeenCalledWith('attempt-1');
    });

    it('should throw NotFoundException for non-existent attempt', async () => {
      // Arrange
      service.getAttemptDetails.mockRejectedValue(
        new NotFoundException('Attempt not found'),
      );

      // Act & Assert
      await expect(controller.getAttemptDetails('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should include failed test details', async () => {
      // Arrange
      const detailedAttempt = {
        ...mockAttemptDetails,
        failedTestsDetails: [
          {
            testIndex: 8,
            passed: false,
            input: { nums: [1], target: 5 },
            expectedOutput: [],
            actualOutput: [0],
            errorMessage: 'Index out of range',
          },
        ],
      };

      service.getAttemptDetails.mockResolvedValue(detailedAttempt);

      // Act
      const result = await controller.getAttemptDetails('attempt-1');

      // Assert
      expect(result.failedTestsDetails).toHaveLength(1);
      expect(result.failedTestsDetails[0].passed).toBe(false);
    });
  });

  describe('getUserStats', () => {
    it('should return user submission statistics', async () => {
      // Arrange
      service.getUserStats.mockResolvedValue(mockSubmissionStats);

      // Act
      const result = await controller.getUserStats({ id: mockUserId } as any);

      // Assert
      expect(result).toEqual(mockSubmissionStats);
      expect(result.totalSubmissions).toBe(42);
      expect(result.successRate).toBe(66.7);
      expect(service.getUserStats).toHaveBeenCalledWith(mockUserId);
    });

    it('should return stats with null values for new users', async () => {
      // Arrange
      const emptyStats: SubmissionStatsDto = {
        totalSubmissions: 0,
        successfulSubmissions: 0,
        successRate: 0,
        avgExecutionTime: null,
        avgMemoryUsed: null,
        problemsAttempted: 0,
        problemsSolved: 0,
      };

      service.getUserStats.mockResolvedValue(emptyStats);

      // Act
      const result = await controller.getUserStats({ id: mockUserId } as any);

      // Assert
      expect(result.totalSubmissions).toBe(0);
      expect(result.avgExecutionTime).toBeNull();
    });
  });

  describe('getUserStatsExtended', () => {
    it('should return extended user statistics for README generation', async () => {
      // Arrange
      service.getUserStatsExtended.mockResolvedValue(mockUserStatsExtended);

      // Act
      const result = await controller.getUserStatsExtended(mockUserId);

      // Assert
      expect(result).toEqual(mockUserStatsExtended);
      expect(result.userId).toBe(mockUserId);
      expect(result.problemsSolved).toBe(12);
      expect(service.getUserStatsExtended).toHaveBeenCalledWith(mockUserId);
    });

    it('should include statistics by language', async () => {
      // Arrange
      service.getUserStatsExtended.mockResolvedValue(mockUserStatsExtended);

      // Act
      const result = await controller.getUserStatsExtended(mockUserId);

      // Assert
      expect(result.languageStats).toHaveLength(1);
      expect(result.languageStats[0].language).toBe('python');
      expect(result.languageStats[0].submissions).toBe(25);
    });

    it('should include statistics by difficulty', async () => {
      // Arrange
      service.getUserStatsExtended.mockResolvedValue(mockUserStatsExtended);

      // Act
      const result = await controller.getUserStatsExtended(mockUserId);

      // Assert
      expect(result.difficultyBreakdown).toEqual({
        easy: 20,
        medium: 15,
        hard: 7,
        total: 42,
      });
    });

    it('should throw NotFoundException for non-existent user', async () => {
      // Arrange
      service.getUserStatsExtended.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      // Act & Assert
      await expect(
        controller.getUserStatsExtended('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getRecentSubmissions', () => {
    it('should return recent submissions with default limit', async () => {
      // Arrange
      service.getRecentSubmissions.mockResolvedValue([mockRecentSubmission]);

      // Act
      const result = await controller.getRecentSubmissions(
        { id: mockUserId } as any,
        10,
      );

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].problemSlug).toBe('two-sum');
      expect(service.getRecentSubmissions).toHaveBeenCalledWith(mockUserId, 10);
    });

    it('should return recent submissions with custom limit', async () => {
      // Arrange
      const mockSubmissions = Array(5)
        .fill(null)
        .map((_, i) => ({
          ...mockRecentSubmission,
          attemptId: `attempt-${i}`,
        }));

      service.getRecentSubmissions.mockResolvedValue(mockSubmissions);

      // Act
      const result = await controller.getRecentSubmissions(
        { id: mockUserId } as any,
        5,
      );

      // Assert
      expect(result).toHaveLength(5);
      expect(service.getRecentSubmissions).toHaveBeenCalledWith(mockUserId, 5);
    });

    it('should return empty array if no recent submissions', async () => {
      // Arrange
      service.getRecentSubmissions.mockResolvedValue([]);

      // Act
      const result = await controller.getRecentSubmissions(
        { id: mockUserId } as any,
        10,
      );

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('getSubmissionById', () => {
    it('should return submission details by ID', async () => {
      // Arrange
      service.getSubmissionById.mockResolvedValue(mockSubmissionDetail);

      // Act
      const result = await controller.getSubmissionById('submission-1', {
        id: mockUserId,
      } as any);

      // Assert
      expect(result).toEqual(mockSubmissionDetail);
      expect(result.id).toBe('submission-1');
      expect(result.problem.title).toBe('Two Sum');
      expect(service.getSubmissionById).toHaveBeenCalledWith(
        'submission-1',
        mockUserId,
      );
    });

    it('should throw NotFoundException for non-existent submission', async () => {
      // Arrange
      service.getSubmissionById.mockRejectedValue(
        new NotFoundException('Submission not found'),
      );

      // Act & Assert
      await expect(
        controller.getSubmissionById('nonexistent', { id: mockUserId } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should include all attempts in submission details', async () => {
      // Arrange
      const submissionWithAttempts = {
        ...mockSubmissionDetail,
        attempts: [
          {
            id: 'attempt-1',
            attemptNumber: 1,
            status: 'failed',
            code: 'old code',
            language: 'python',
            executionTime: 150,
            memoryUsed: 45,
            passedTests: 5,
            failedTests: 5,
            totalTests: 10,
            errorMessage: null,
            createdAt: new Date(),
            completedAt: new Date(),
            testResults: [],
          },
          {
            id: 'attempt-2',
            attemptNumber: 2,
            status: 'success',
            code: 'new code',
            language: 'python',
            executionTime: 125,
            memoryUsed: 42,
            passedTests: 10,
            failedTests: 0,
            totalTests: 10,
            errorMessage: null,
            createdAt: new Date(),
            completedAt: new Date(),
            testResults: [],
          },
        ],
      };

      service.getSubmissionById.mockResolvedValue(
        submissionWithAttempts as any,
      );

      // Act
      const result = await controller.getSubmissionById('submission-1', {
        id: mockUserId,
      } as any);

      // Assert
      expect(result.attempts).toHaveLength(2);
      expect(result.attempts[0].status).toBe('failed');
      expect(result.attempts[1].status).toBe('success');
    });
  });

  describe('deleteSubmission', () => {
    it('should delete a submission successfully', async () => {
      // Arrange
      const deleteResponse: DeleteResponseDto = {
        message: 'Submission deleted successfully',
        deletedId: 'submission-1',
      };

      service.deleteSubmission.mockResolvedValue(deleteResponse);

      // Act
      const result = await controller.deleteSubmission('submission-1', {
        id: mockUserId,
      } as any);

      // Assert
      expect(result.message).toBe('Submission deleted successfully');
      expect(result.deletedId).toBe('submission-1');
      expect(service.deleteSubmission).toHaveBeenCalledWith(
        'submission-1',
        mockUserId,
      );
    });

    it('should throw NotFoundException when deleting non-existent submission', async () => {
      // Arrange
      service.deleteSubmission.mockRejectedValue(
        new NotFoundException('Submission not found'),
      );

      // Act & Assert
      await expect(
        controller.deleteSubmission('nonexistent', { id: mockUserId } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should only allow users to delete their own submissions', async () => {
      // Arrange
      const differentUserId = 'different-user';

      service.deleteSubmission.mockRejectedValue(
        new NotFoundException('Submission not found'),
      );

      // Act & Assert
      await expect(
        controller.deleteSubmission('submission-1', {
          id: differentUserId,
        } as any),
      ).rejects.toThrow(NotFoundException);

      expect(service.deleteSubmission).toHaveBeenCalledWith(
        'submission-1',
        differentUserId,
      );
    });
  });
});