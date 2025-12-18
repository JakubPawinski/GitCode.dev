import { Test, TestingModule } from '@nestjs/testing';
import { ProblemService } from './problem.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ProblemResponseDto, UserSubmissionDto, DifficultyLevel } from './dto';

describe('ProblemService', () => {
  let service: ProblemService;
  let prisma: PrismaService;

  const mockProblem: ProblemResponseDto = {
    id: '1',
    problemId: '1',
    title: 'Two Sum',
    difficulty: 'EASY',
    problemSlug: 'two-sum',
    description: 'Find two numbers that add up to target',
    topics: ['Array'],
    similarProblems: [],
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
      jest.spyOn(prisma.problem, 'count').mockResolvedValue(1);
      jest.spyOn(prisma.problem, 'findMany').mockResolvedValue([
        {
          ...mockProblem,
          topics: ['Array'],
          similarProblems: [],
        } as any,
      ]);

      const result = await service.getPaginatedProblems(mockPaginationDto);

      expect(result.data).toHaveLength(1);
      expect(result.meta.currentPage).toBe(1);
      expect(result.meta.pageSize).toBe(10);
      expect(prisma.problem.findMany).toHaveBeenCalled();
    });

    it('should filter by difficulty', async () => {
      const paginationDto = {
        ...mockPaginationDto,
        difficulty: 'easy' as const,
      };
      jest.spyOn(prisma.problem, 'count').mockResolvedValue(1);
      jest.spyOn(prisma.problem, 'findMany').mockResolvedValue([
        {
          ...mockProblem,
          topics: [],
          similarProblems: [],
        } as any,
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
          topics: ['Array'],
          similarProblems: [],
        } as any,
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
        id: '1',
        problemId: '1',
        title: 'Two Sum',
        difficulty: 'EASY',
        problemSlug: 'two-sum',
        description: 'Find two numbers that add up to target',
        topics: [{ topic: 'Array' }],
        examples: [{ inputText: 'Input', outputText: 'Output' }],
        constraints: [{ constraint: 'Constraint 1' }],
        hints: [{ hintText: 'Hint 1', orderIndex: 0 }],
        testCases: [{ input: '[]', expectedOutput: '[]' }],
        similarProblems: [
          {
            problemTo: {
              title: 'Three Sum',
              problemSlug: 'three-sum',
              difficulty: 'MEDIUM',
              description: 'desc',
            },
          },
        ],
      } as any);

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
        } as any,
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
        id: '1',
        problemId: '1',
        title: 'Two Sum',
        difficulty: 'EASY',
        problemSlug: 'two-sum',
        description: 'Description',
        topics: [{ topic: 'Array' }],
        examples: [],
        constraints: [],
        hints: [],
        testCases: [{ input: '{}', expectedOutput: 'null' }],
        similarProblems: [],
      } as any);

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
        id: '1',
        problemId: '1',
        title: 'Two Sum Updated',
        difficulty: 'EASY',
        problemSlug: 'two-sum',
        description: 'Find two numbers that add up to target',
        topics: [{ topic: 'Array' }],
        examples: [{ inputText: 'Input', outputText: 'Output' }],
        constraints: [{ constraint: 'Constraint 1' }],
        hints: [{ hintText: 'Hint 1', orderIndex: 0 }],
        testCases: [{ input: '[]', expectedOutput: '[]' }],
        similarProblems: [
          {
            problemTo: {
              title: 'Three Sum',
              problemSlug: 'three-sum',
              difficulty: 'MEDIUM',
              description: 'desc',
            },
          },
        ],
      } as any);

      const result = await service.updateProblem('1', updateDto);

      expect(result.title).toBe('Two Sum Updated');
      expect(prisma.problem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
        }),
      );
    });

    describe('deleteProblem', () => {
      it('should delete a problem', async () => {
        jest
          .spyOn(prisma.problem, 'findUnique')
          .mockResolvedValue(mockProblem as any);
        jest
          .spyOn(prisma.problem, 'delete')
          .mockResolvedValue(mockProblem as any);

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
        } as any);

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
            isSolved: true,
            problem: {
              id: '1',
              title: 'Two Sum',
              problemSlug: 'two-sum',
              difficulty: 'EASY',
            },
            attempts: [
              {
                status: 'success',
                completedAt: new Date(),
              },
            ],
          },
        ] as any);

        jest.spyOn(prisma.problem, 'count').mockResolvedValue(10);

        const result = await service.getUserProgress('user1');

        expect(result.userId).toBe('user1');
        expect(result.solvedProblems).toBe(1);
        expect(result.attemptedProblems).toBe(1);
        expect(result.totalProblems).toBe(10);
      });
    });

    describe('getTrending', () => {
      it('should return trending problems', async () => {
        jest.spyOn(prisma.problem, 'findMany').mockResolvedValue([
          {
            id: '1',
            problemId: '1',
            title: 'Two Sum',
            problemSlug: 'two-sum',
            difficulty: 'EASY',
            description: 'Find two numbers that add up to target',
            topics: [{ topic: 'Array' }],
            problemStats: [
              {
                totalSubmissions: 100,
                acceptedSubmissions: 50,
                acceptanceRate: 50,
              },
            ],
            similarProblems: [
              {
                problemTo: {
                  title: 'Three Sum',
                  problemSlug: 'three-sum',
                  difficulty: 'MEDIUM',
                },
              },
            ],
          },
        ] as any);

        const result = await service.getTrending();

        expect(result.trending).toHaveLength(1);
        expect(result.trendingCount).toBe(1);
        expect(result.trending[0].totalSubmissions).toBe(100);
        expect(result.trending[0].acceptanceRate).toBe(50);
      });
    });

    describe('getUserProblemSubmissions', () => {
      it('should return user submissions for a problem', async () => {
        jest.spyOn(prisma.problem, 'findUnique').mockResolvedValue({
          ...mockProblem,
          id: '1',
        } as any);

        const userSubmission: UserSubmissionDto = {
          userId: 'user1',
          problemSlug: 'two-sum',
          totalAttempts: 1,
          isSolved: true,
          currentLanguage: 'python',
          attempts: [
            {
              id: 'sub1',
              status: 'success',
              code: 'print("Hello World")',
              language: 'python',
              executionTime: 50,
              memoryUsed: 10,
              submittedAt: new Date(),
            },
          ],
          bestAttempt: {
            id: 'sub1',
            status: 'success',
            code: 'print("Hello World")',
            language: 'python',
            executionTime: 50,
            memoryUsed: 10,
            submittedAt: new Date(),
          },
          lastSubmittedAt: new Date(),
        };

        jest
          .spyOn(prisma.userSubmission, 'findUnique')
          .mockResolvedValue(userSubmission as any);

        const result = await service.getUserProblemSubmissions(
          'two-sum',
          'user1',
        );

        expect(result.userId).toBe('user1');
        expect(result.problemSlug).toBe('two-sum');
        expect(result.totalAttempts).toBe(1);
      });

      it('should return default response when no submission found', async () => {
        jest.spyOn(prisma.problem, 'findUnique').mockResolvedValue({
          ...mockProblem,
          id: '1',
        } as any);

        jest.spyOn(prisma.userSubmission, 'findUnique').mockResolvedValue(null);

        const result = await service.getUserProblemSubmissions(
          'two-sum',
          'user1',
        );

        expect(result.totalAttempts).toBe(0);
        expect(result.isSolved).toBe(false);
        expect(result.attempts).toEqual([]);
      });
    });

    describe('getRecommended', () => {
      it('should return recommended problems based on topics', async () => {
        jest.spyOn(prisma.userSubmission, 'findMany').mockResolvedValue([
          {
            problemId: '1',
          },
        ] as any);

        jest
          .spyOn(prisma.problemTopic, 'findMany')
          .mockResolvedValue([
            { topic: 'Array', id: '1', problemId: '1' },
          ] as any);

        jest.spyOn(prisma.problem, 'findMany').mockResolvedValue([
          {
            ...mockProblem,
            problemId: '2',
            topics: ['Array'],
            similarProblems: [],
          },
        ] as any);

        const result = await service.getRecommended('user1');

        expect(result.userId).toBe('user1');
        expect(result.recommendedCount).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
