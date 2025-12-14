import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionService } from './submission.service';
import { PrismaService } from '../prisma/prisma.service';
import { SubmissionGateway } from './submission.gateway';
import { DockerExecutorService } from './docker-executor.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { Queue } from 'bull';
import { getQueueToken } from '@nestjs/bullmq';
import { PaginationDto } from '@gitcode/common';

describe('SubmissionService', () => {
  let service: SubmissionService;
  let prisma: PrismaService;
  let submissionGateway: SubmissionGateway;
  let submissionsQueue: Queue;

  const mockUserId = 'user-123';
  const mockProblemId = 'problem-1';
  const mockSubmissionId = 'submission-1';
  const mockAttemptId = 'attempt-1';

  const mockProblem = {
    id: mockProblemId,
    title: 'Two Sum',
    problemSlug: 'two-sum',
    difficulty: 'EASY',
    testCases: [
      {
        id: 'tc-1',
        input: '{"nums": [2, 7], "target": 9}',
        expectedOutput: '[0, 1]',
      },
    ],
  };

  const mockUserSubmission = {
    id: mockSubmissionId,
    userId: mockUserId,
    problemId: mockProblemId,
    status: 'in_progress',
    currentCode: 'def twoSum(nums, target): pass',
    currentLanguage: 'python',
    totalTestCases: 1,
    githubUrl: null,
    commitHash: null,
    acceptedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    submittedAt: new Date(),
  };

  const mockSolutionAttempt = {
    id: mockAttemptId,
    submissionId: mockSubmissionId,
    code: 'def twoSum(nums, target): pass',
    language: 'python',
    status: 'pending',
    attemptNumber: 1,
    passedTests: 0,
    failedTests: 0,
    totalTests: 1,
    executionTime: null,
    memoryUsed: null,
    errorMessage: null,
    createdAt: new Date(),
    completedAt: null,
  };

  const mockPaginationDto: PaginationDto = {
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  };

  beforeEach(async () => {
    const mockSubmissionsQueue = {
      add: jest.fn(),
      getActiveCount: jest.fn(),
      getWaitingCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionService,
        {
          provide: PrismaService,
          useValue: {
            problem: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
            userSubmission: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              upsert: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            solutionAttempt: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              count: jest.fn(),
            },
            testResult: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: SubmissionGateway,
          useValue: {
            notifyAttemptUpdate: jest.fn(),
            notifyTestResult: jest.fn(),
          },
        },
        {
          provide: DockerExecutorService,
          useValue: {
            executeCode: jest.fn(),
          },
        },
        {
          provide: getQueueToken('submissions'),
          useValue: mockSubmissionsQueue,
        },
      ],
    }).compile();

    service = module.get<SubmissionService>(SubmissionService);
    prisma = module.get<PrismaService>(PrismaService);
    submissionGateway = module.get<SubmissionGateway>(SubmissionGateway);
    submissionsQueue = module.get<Queue>(getQueueToken('submissions'));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new submission and add to queue', async () => {
      const createSubmissionDto: CreateSubmissionDto = {
        problemId: mockProblemId,
        code: 'def twoSum(nums, target): pass',
        language: 'python',
      };

      process.env.LANGUAGES_SUPPORTED = 'python,javascript,java';

      jest
        .spyOn(prisma.problem, 'findUnique')
        .mockResolvedValue(mockProblem as any);
      jest
        .spyOn(prisma.userSubmission, 'upsert')
        .mockResolvedValue(mockUserSubmission as any);
      jest
        .spyOn(prisma.solutionAttempt, 'create')
        .mockResolvedValue(mockSolutionAttempt as any);
      jest.spyOn(prisma.solutionAttempt, 'count').mockResolvedValue(0);
      jest
        .spyOn(submissionsQueue, 'add')
        .mockResolvedValue({ id: 'job-1' } as any);
      jest.spyOn(submissionsQueue, 'getActiveCount').mockResolvedValue(1);
      jest.spyOn(submissionsQueue, 'getWaitingCount').mockResolvedValue(2);

      const result = await service.create(createSubmissionDto, mockUserId);

      expect(result).toBeDefined();
      expect(result.status).toBe('pending');
      expect(submissionsQueue.add).toHaveBeenCalled();
      expect(submissionGateway.notifyAttemptUpdate).toHaveBeenCalledWith(
        mockUserId,
        expect.any(String),
        expect.objectContaining({
          status: 'queued',
        }),
      );
    });

    it('should throw NotFoundException when problem does not exist', async () => {
      const createSubmissionDto: CreateSubmissionDto = {
        problemId: 'nonexistent',
        code: 'code',
        language: 'python',
      };

      jest.spyOn(prisma.problem, 'findUnique').mockResolvedValue(null);

      await expect(
        service.create(createSubmissionDto, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for unsupported language', async () => {
      const createSubmissionDto: CreateSubmissionDto = {
        problemId: mockProblemId,
        code: 'code',
        language: 'unsupported',
      };

      process.env.LANGUAGES_SUPPORTED = 'python,javascript';

      jest
        .spyOn(prisma.problem, 'findUnique')
        .mockResolvedValue(mockProblem as any);

      await expect(
        service.create(createSubmissionDto, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAttemptDetails', () => {
    it('should return attempt details with test results', async () => {
      const mockAttemptWithTests = {
        ...mockSolutionAttempt,
        status: 'success',
        passedTests: 1,
        failedTests: 0,
        testResults: [
          {
            id: 'tr-1',
            testIndex: 0,
            passed: true,
            input: '{"nums": [2, 7], "target": 9}',
            expectedOutput: '[0, 1]',
            actualOutput: '[0, 1]',
            errorMessage: null,
          },
        ],
      };

      jest
        .spyOn(prisma.solutionAttempt, 'findUnique')
        .mockResolvedValue(mockAttemptWithTests as any);

      const result = await service.getAttemptDetails(mockAttemptId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockAttemptId);
      expect(result.status).toBe('success');
      expect(result.passedTests).toBe(1);
      expect(result.testResults).toHaveLength(1);
    });

    it('should throw NotFoundException when attempt not found', async () => {
      jest.spyOn(prisma.solutionAttempt, 'findUnique').mockResolvedValue(null);

      await expect(service.getAttemptDetails('nonexistent')).rejects.toThrow(
        Error,
      );
    });

    it('should include failed test details', async () => {
      const mockAttemptWithFailedTests = {
        ...mockSolutionAttempt,
        status: 'failed',
        passedTests: 1,
        failedTests: 1,
        testResults: [
          {
            id: 'tr-1',
            testIndex: 0,
            passed: true,
            input: '{"nums": [2, 7], "target": 9}',
            expectedOutput: '[0, 1]',
            actualOutput: '[0, 1]',
            errorMessage: null,
          },
          {
            id: 'tr-2',
            testIndex: 1,
            passed: false,
            input: '{"nums": [1], "target": 5}',
            expectedOutput: '[]',
            actualOutput: null,
            errorMessage: 'Index out of range',
          },
        ],
      };

      jest
        .spyOn(prisma.solutionAttempt, 'findUnique')
        .mockResolvedValue(mockAttemptWithFailedTests as any);

      const result = await service.getAttemptDetails(mockAttemptId);

      expect(result.failedTestsDetails).toHaveLength(1);
      expect(result.failedTestsDetails[0].passed).toBe(false);
    });
  });

  describe('getUserSubmissionHistory', () => {
    it('should return paginated submission history', async () => {
      const mockSubmissions = [
        {
          ...mockUserSubmission,
          problem: {
            id: mockProblemId,
            title: 'Two Sum',
            problemSlug: 'two-sum',
            difficulty: 'EASY',
          },
          attempts: [
            {
              id: mockAttemptId,
              status: 'success',
              passedTests: 1,
              failedTests: 0,
              totalTests: 1,
              executionTime: 100,
              memoryUsed: 50,
              errorMessage: null,
              createdAt: new Date(),
            },
          ],
        },
      ];

      jest.spyOn(prisma.userSubmission, 'count').mockResolvedValue(1);
      jest
        .spyOn(prisma.userSubmission, 'findMany')
        .mockResolvedValue(mockSubmissions as any);

      const result = await service.getUserSubmissionHistory(
        mockUserId,
        mockPaginationDto,
      );

      expect(result.data).toHaveLength(1);
      expect(result.meta.currentPage).toBe(1);
      expect(result.meta.pageSize).toBe(10);
      expect(result.meta.totalItems).toBe(1);
    });

    it('should handle empty submission history', async () => {
      jest.spyOn(prisma.userSubmission, 'count').mockResolvedValue(0);
      jest.spyOn(prisma.userSubmission, 'findMany').mockResolvedValue([]);

      const result = await service.getUserSubmissionHistory(
        mockUserId,
        mockPaginationDto,
      );

      expect(result.data).toHaveLength(0);
      expect(result.meta.totalItems).toBe(0);
    });

    it('should apply pagination correctly', async () => {
      const paginationDto: PaginationDto = {
        page: 2,
        limit: 5,
        sortBy: 'submittedAt',
        sortOrder: 'asc',
      };

      jest.spyOn(prisma.userSubmission, 'count').mockResolvedValue(15);
      jest.spyOn(prisma.userSubmission, 'findMany').mockResolvedValue([]);

      const result = await service.getUserSubmissionHistory(
        mockUserId,
        paginationDto,
      );

      expect(result.meta.currentPage).toBe(2);
      expect(result.meta.pageSize).toBe(5);
      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.hasPreviousPage).toBe(true);
    });
  });

  describe('getUserStats', () => {
    it('should return user submission statistics', async () => {
      const mockSubmissions = [
        {
          userId: mockUserId,
          attempts: [
            {
              status: 'success',
              executionTime: 100,
              memoryUsed: 50,
            },
            {
              status: 'failed',
              executionTime: 150,
              memoryUsed: 45,
            },
          ],
        },
        {
          userId: mockUserId,
          attempts: [
            {
              status: 'success',
              executionTime: 120,
              memoryUsed: 55,
            },
          ],
        },
      ];

      jest
        .spyOn(prisma.userSubmission, 'findMany')
        .mockResolvedValue(mockSubmissions as any);

      const result = await service.getUserStats(mockUserId);

      expect(result).toBeDefined();
      expect(result.totalSubmissions).toBe(3);
      expect(result.successfulSubmissions).toBe(2);
      expect(result.problemsAttempted).toBe(2);
      expect(result.problemsSolved).toBe(2);
      expect(result.successRate).toBeGreaterThan(0);
    });

    it('should return stats with null averages for new users', async () => {
      jest.spyOn(prisma.userSubmission, 'findMany').mockResolvedValue([]);

      const result = await service.getUserStats(mockUserId);

      expect(result.totalSubmissions).toBe(0);
      expect(result.successfulSubmissions).toBe(0);
      expect(result.avgExecutionTime).toBeNull();
      expect(result.avgMemoryUsed).toBeNull();
    });
  });

  describe('getRecentSubmissions', () => {
    it('should return recent submissions', async () => {
      const mockAttempts = [
        {
          id: mockAttemptId,
          status: 'success',
          language: 'python',
          executionTime: 125,
          memoryUsed: 42,
          passedTests: 8,
          failedTests: 0,
          totalTests: 8,
          createdAt: new Date(),
          submission: {
            problem: {
              id: mockProblemId,
              title: 'Two Sum',
              problemSlug: 'two-sum',
              difficulty: 'EASY',
            },
          },
        },
      ];

      jest
        .spyOn(prisma.solutionAttempt, 'findMany')
        .mockResolvedValue(mockAttempts as any);

      const result = await service.getRecentSubmissions(mockUserId, 10);

      expect(result).toHaveLength(1);
      expect(result[0].attemptId).toBe(mockAttemptId);
      expect(result[0].problemTitle).toBe('Two Sum');
      expect(result[0].status).toBe('success');
    });

    it('should respect limit parameter', async () => {
      jest.spyOn(prisma.solutionAttempt, 'findMany').mockResolvedValue([]);

      await service.getRecentSubmissions(mockUserId, 5);

      expect(prisma.solutionAttempt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        }),
      );
    });

    it('should return empty array if no recent submissions', async () => {
      jest.spyOn(prisma.solutionAttempt, 'findMany').mockResolvedValue([]);

      const result = await service.getRecentSubmissions(mockUserId, 10);

      expect(result).toHaveLength(0);
    });
  });

  describe('getSubmissionById', () => {
    it('should return submission details', async () => {
      const mockSubmissionDetail = {
        ...mockUserSubmission,
        problem: {
          id: mockProblemId,
          title: 'Two Sum',
          problemSlug: 'two-sum',
          difficulty: 'EASY',
          description: 'Find two numbers that add up to target',
        },
        attempts: [
          {
            id: mockAttemptId,
            attemptNumber: 1,
            status: 'success',
            code: 'def twoSum(nums, target): pass',
            language: 'python',
            executionTime: 100,
            memoryUsed: 50,
            passedTests: 1,
            failedTests: 0,
            totalTests: 1,
            errorMessage: null,
            createdAt: new Date(),
            completedAt: new Date(),
            testResults: [],
          },
        ],
        feedbacks: [],
      };

      jest
        .spyOn(prisma.userSubmission, 'findFirst')
        .mockResolvedValue(mockSubmissionDetail as any);

      const result = await service.getSubmissionById(
        mockSubmissionId,
        mockUserId,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(mockSubmissionId);
      expect(result.problem.title).toBe('Two Sum');
      expect(result.attempts).toHaveLength(1);
    });

    it('should throw NotFoundException when submission not found', async () => {
      jest.spyOn(prisma.userSubmission, 'findFirst').mockResolvedValue(null);

      await expect(
        service.getSubmissionById(mockSubmissionId, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should only return submissions for the requesting user', async () => {
      jest.spyOn(prisma.userSubmission, 'findFirst').mockResolvedValue(null);

      await expect(
        service.getSubmissionById(mockSubmissionId, 'different-user'),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.userSubmission.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'different-user',
          }),
        }),
      );
    });
  });

  describe('deleteSubmission', () => {
    it('should delete a submission', async () => {
      jest
        .spyOn(prisma.userSubmission, 'findFirst')
        .mockResolvedValue(mockUserSubmission as any);
      jest
        .spyOn(prisma.userSubmission, 'delete')
        .mockResolvedValue(mockUserSubmission as any);

      const result = await service.deleteSubmission(
        mockSubmissionId,
        mockUserId,
      );

      expect(result.message).toBe('Submission deleted successfully');
      expect(result.deletedId).toBe(mockSubmissionId);
      expect(prisma.userSubmission.delete).toHaveBeenCalledWith({
        where: { id: mockSubmissionId },
      });
    });

    it('should throw NotFoundException when submission not found', async () => {
      jest.spyOn(prisma.userSubmission, 'findFirst').mockResolvedValue(null);

      await expect(
        service.deleteSubmission(mockSubmissionId, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should only allow users to delete their own submissions', async () => {
      jest.spyOn(prisma.userSubmission, 'findFirst').mockResolvedValue(null);

      await expect(
        service.deleteSubmission(mockSubmissionId, 'different-user'),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.userSubmission.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockSubmissionId,
          userId: 'different-user',
        },
      });
    });
  });
});
