import { Test, TestingModule } from '@nestjs/testing';
import { ProblemService } from './problem.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DifficultyLevel } from './dto/create-problem.dto';

describe('ProblemService', () => {
  let service: ProblemService;
  let prisma: PrismaService;

  const mockProblem = {
    id: '1',
    problemId: '1',
    frontendId: '1',
    title: 'Two Sum',
    difficulty: 'EASY',
    problemSlug: 'two-sum',
    description: 'Find two numbers that add up to target',
    solutions: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    codeSnippets: {},
  };

  const mockPaginationDto = {
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc' as const,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProblemService,
        {
          provide: PrismaService,
          useValue: {
            problem: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              count: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            problemStats: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            userSubmission: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
            problemTopic: {
              findMany: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProblemService>(ProblemService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHealth', () => {
    it('should return health status', () => {
      const result = service.getHealth();
      expect(result).toEqual({ status: 'Problem Service is healthy' });
    });
  });

  describe('getPaginatedProblems', () => {
    it('should return paginated problems', async () => {
      const mockProblems = [mockProblem];
      jest.spyOn(prisma.problem, 'count').mockResolvedValue(1);
      jest.spyOn(prisma.problem, 'findMany').mockResolvedValue([
        {
          ...mockProblem,
          topics: [{ topic: 'Array' }],
          similarProblems: [],
        },
      ]);

      const result = await service.getPaginatedProblems(mockPaginationDto);

      expect(result.data).toHaveLength(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(prisma.problem.findMany).toHaveBeenCalled();
    });

    it('should filter by difficulty', async () => {
      const paginationDto = { ...mockPaginationDto, difficulty: 'EASY' };
      jest.spyOn(prisma.problem, 'count').mockResolvedValue(1);
      jest.spyOn(prisma.problem, 'findMany').mockResolvedValue([
        {
          ...mockProblem,
          topics: [],
          similarProblems: [],
        },
      ]);

      await service.getPaginatedProblems(paginationDto);

      expect(prisma.problem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            difficulty: 'EASY',
          }),
        }),
      );
    });

    it('should filter by topic', async () => {
      const paginationDto = { ...mockPaginationDto, topic: 'Array' };
      jest.spyOn(prisma.problem, 'count').mockResolvedValue(1);
      jest.spyOn(prisma.problem, 'findMany').mockResolvedValue([
        {
          ...mockProblem,
          topics: [{ topic: 'Array' }],
          similarProblems: [],
        },
      ]);

      await service.getPaginatedProblems(paginationDto);

      expect(prisma.problem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            topics: expect.any(Object),
          }),
        }),
      );
    });
  });

  describe('findProblemBySlug', () => {
    it('should return problem by slug', async () => {
      jest.spyOn(prisma.problem, 'findUnique').mockResolvedValue({
        ...mockProblem,
        topics: [{ topic: 'Array' }],
        examples: [{ inputText: 'Input', outputText: 'Output' }],
        constraints: [{ constraint: 'Constraint 1' }],
        hints: [{ hintText: 'Hint 1', orderIndex: 0 }],
        testCases: [{ input: '[]', expectedOutput: '[]' }],
        similarProblems: [],
      });

      const result = await service.findProblemBySlug('two-sum');

      expect(result.title).toBe('Two Sum');
      expect(result.topics).toContain('Array');
      expect(prisma.problem.findUnique).toHaveBeenCalledWith({
        where: { problemSlug: 'two-sum' },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException when problem not found', async () => {
      jest.spyOn(prisma.problem, 'findUnique').mockResolvedValue(null);

      await expect(service.findProblemBySlug('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('searchProblems', () => {
    it('should search problems by title', async () => {
      jest.spyOn(prisma.problem, 'count').mockResolvedValue(1);
      jest.spyOn(prisma.problem, 'findMany').mockResolvedValue([
        {
          ...mockProblem,
          topics: [],
          similarProblems: [],
        },
      ]);

      const result = await service.searchProblems('Two', mockPaginationDto);

      expect(result.data).toHaveLength(1);
      expect(prisma.problem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
    });

    it('should throw BadRequestException for empty query', async () => {
      await expect(
        service.searchProblems('', mockPaginationDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for whitespace-only query', async () => {
      await expect(
        service.searchProblems('   ', mockPaginationDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createProblem', () => {
    it('should create a new problem', async () => {
      const createDto = {
        title: 'Two Sum',
        problemId: '1',
        frontendId: '1',
        difficulty: DifficultyLevel.EASY,
        problemSlug: 'two-sum',
        description: 'Description',
        topics: ['Array'],
        testCases: [{ input: {}, output: null }],
      };

      jest.spyOn(prisma.problem, 'create').mockResolvedValue({
        ...mockProblem,
        topics: [{ topic: 'Array' }],
        examples: [],
        constraints: [],
        hints: [],
        testCases: [{ input: '{}', expectedOutput: 'null' }],
        similarProblems: [],
      });

      jest.spyOn(prisma.problemStats, 'create').mockResolvedValue({
        id: '1',
        problemId: '1',
        totalSubmissions: 0,
        acceptedSubmissions: 0,
        acceptanceRate: 0,
        avgExecutionTime: 0,
        avgMemoryUsed: 0,
        updatedAt: new Date(),
      });

      const result = await service.createProblem(createDto);

      expect(result.title).toBe('Two Sum');
      expect(prisma.problem.create).toHaveBeenCalled();
      expect(prisma.problemStats.create).toHaveBeenCalled();
    });
  });

  describe('updateProblem', () => {
    it('should update an existing problem', async () => {
      const updateDto = {
        id: '1',
        title: 'Two Sum Updated',
      };

      jest.spyOn(prisma.problem, 'update').mockResolvedValue({
        ...mockProblem,
        title: 'Two Sum Updated',
        topics: [],
        examples: [],
        constraints: [],
        hints: [],
        testCases: [],
        similarProblems: [],
      });

      const result = await service.updateProblem('1', updateDto);

      expect(result.title).toBe('Two Sum Updated');
      expect(prisma.problem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
        }),
      );
    });
  });

  describe('deleteProblem', () => {
    it('should delete a problem', async () => {
      jest.spyOn(prisma.problem, 'findUnique').mockResolvedValue(mockProblem);
      jest.spyOn(prisma.problem, 'delete').mockResolvedValue(mockProblem);

      const result = await service.deleteProblem('1');

      expect(result.message).toBe('Problem deleted successfully');
      expect(result.deletedId).toBe('1');
      expect(prisma.problem.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NotFoundException when problem not found', async () => {
      jest.spyOn(prisma.problem, 'findUnique').mockResolvedValue(null);

      await expect(service.deleteProblem('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getProblemStats', () => {
    it('should return problem statistics', async () => {
      jest.spyOn(prisma.problem, 'findUnique').mockResolvedValue({
        ...mockProblem,
        id: '1',
      });

      jest.spyOn(prisma.problemStats, 'findUnique').mockResolvedValue({
        id: '1',
        problemId: '1',
        totalSubmissions: 100,
        acceptedSubmissions: 50,
        acceptanceRate: 50,
        avgExecutionTime: 100,
        avgMemoryUsed: 50,
        updatedAt: new Date(),
      });

      const result = await service.getProblemStats('two-sum');

      expect(result.totalSubmissions).toBe(100);
      expect(result.acceptanceRate).toBe(50);
    });

    it('should throw NotFoundException when problem not found', async () => {
      jest.spyOn(prisma.problem, 'findUnique').mockResolvedValue(null);

      await expect(service.getProblemStats('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUserProgress', () => {
    it('should return user progress', async () => {
      jest.spyOn(prisma.userSubmission, 'findMany').mockResolvedValue([
        {
          userId: 'user1',
          problemId: '1',
          status: 'success',
          attempts: [{ status: 'success', completedAt: new Date() }],
          problem: {
            id: '1',
            title: 'Two Sum',
            problemSlug: 'two-sum',
            difficulty: 'EASY',
          },
        },
      ]);

      jest.spyOn(prisma.problem, 'count').mockResolvedValue(10);

      const result = await service.getUserProgress('user1');

      expect(result.userId).toBe('user1');
      expect(result.solvedProblems).toBe(1);
      expect(result.attemptedProblems).toBe(1);
    });
  });

  describe('getTrending', () => {
    it('should return trending problems', async () => {
      jest.spyOn(prisma.problem, 'findMany').mockResolvedValue([
        {
          ...mockProblem,
          problemStats: [{ totalSubmissions: 1000, acceptanceRate: 45 }],
          topics: [],
          similarProblems: [],
        },
      ]);

      const result = await service.getTrending();

      expect(result.trending).toHaveLength(1);
      expect(result.trendingCount).toBe(1);
    });
  });

  describe('getUserProblemSubmissions', () => {
    it('should return user submissions for a problem', async () => {
      jest.spyOn(prisma.problem, 'findUnique').mockResolvedValue({
        ...mockProblem,
        id: '1',
      });

      jest.spyOn(prisma.userSubmission, 'findUnique').mockResolvedValue({
        userId: 'user1',
        problemId: '1',
        status: 'success',
        currentLanguage: 'python',
        submittedAt: new Date(),
        attempts: [
          {
            id: 'attempt1',
            status: 'success',
            code: 'code',
            language: 'python',
            executionTime: 100,
            memoryUsed: 50,
            createdAt: new Date(),
          },
        ],
      });

      const result = await service.getUserProblemSubmissions('two-sum', 'user1');

      expect(result.userId).toBe('user1');
      expect(result.problemSlug).toBe('two-sum');
      expect(result.totalAttempts).toBe(1);
    });

    it('should return default response when no submission found', async () => {
      jest.spyOn(prisma.problem, 'findUnique').mockResolvedValue({
        ...mockProblem,
        id: '1',
      });

      jest.spyOn(prisma.userSubmission, 'findUnique').mockResolvedValue(null);

      const result = await service.getUserProblemSubmissions('two-sum', 'user1');

      expect(result.totalAttempts).toBe(0);
      expect(result.status).toBe('pending');
      expect(result.attempts).toEqual([]);
    });
  });

  describe('getRecommended', () => {
    it('should return recommended problems based on topics', async () => {
      jest.spyOn(prisma.userSubmission, 'findMany').mockResolvedValue([
        {
          problemId: '1',
          attempts: [{ status: 'success' }],
        },
      ]);

      jest.spyOn(prisma.problemTopic, 'findMany').mockResolvedValue([
        { topic: 'Array' },
      ]);

      jest.spyOn(prisma.problem, 'findMany').mockResolvedValue([
        {
          ...mockProblem,
          problemId: '2',
          topics: [{ topic: 'Array' }],
          similarProblems: [],
        },
      ]);

      const result = await service.getRecommended('user1');

      expect(result.userId).toBe('user1');
      expect(result.recommendedCount).toBeGreaterThanOrEqual(0);
    });
  });
});