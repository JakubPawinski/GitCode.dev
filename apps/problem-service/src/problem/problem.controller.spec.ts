import { Test, TestingModule } from '@nestjs/testing';
import { ProblemController } from './problem.controller';
import { ProblemService } from './problem.service';
import {
  ProblemResponseDto,
  UserProgressResponseDto,
  RecommendedResponseDto,
  TrendingResponseDto,
  ProblemStatsResponseDto,
  UserSubmissionDto,
  ProblemPaginationQueryDto,
} from './dto';
import { PaginatedResult } from '@gitcode/types';
describe('ProblemController', () => {
  let controller: ProblemController;

  const mockProblemService = {
    getHealth: jest.fn(),
    getPaginatedProblems: jest.fn(),
    getUserProgress: jest.fn(),
    getRecommended: jest.fn(),
    searchProblems: jest.fn(),
    getTrending: jest.fn(),
    findProblemBySlug: jest.fn(),
    getProblemStats: jest.fn(),
    getUserProblemSubmissions: jest.fn(),
    createProblem: jest.fn(),
    updateProblem: jest.fn(),
    deleteProblem: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProblemController],
      providers: [{ provide: ProblemService, useValue: mockProblemService }],
    }).compile();

    controller = module.get<ProblemController>(ProblemController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHealth', () => {
    it('returns service health', () => {
      const health = { status: 'ok' };
      mockProblemService.getHealth.mockReturnValue(health);

      const result = controller.getHealth();

      expect(mockProblemService.getHealth).toHaveBeenCalledTimes(1);
      expect(result).toBe(health);
    });
  });

  describe('findAll', () => {
    it('returns paginated problems', async () => {
      const paginationDto: ProblemPaginationQueryDto = {
        page: 2,
        limit: 5,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
      const expected: PaginatedResult<ProblemResponseDto> = {
        data: [
          {
            id: '1',
            problemId: '1',
            title: 'Two Sum',
            difficulty: 'EASY',
            problemSlug: 'two-sum',
            description: 'Find two numbers',
            topics: ['Array'],
            similarProblems: [],
          },
        ],
        meta: {
          currentPage: 2,
          pageSize: 5,
          totalItems: 10,
          totalPages: 2,
          hasNextPage: false,
          hasPreviousPage: true,
        },
      };
      mockProblemService.getPaginatedProblems.mockResolvedValue(expected);

      const result = await controller.findAll(paginationDto);

      expect(mockProblemService.getPaginatedProblems).toHaveBeenCalledWith(
        paginationDto,
      );
      expect(result).toBe(expected);
    });
  });

  describe('getUserProgress', () => {
    it('uses user id from @User() decorator', async () => {
      const user = { id: 'user-1' } as any;
      const expected: UserProgressResponseDto = {
        userId: 'user-1',
        totalProblems: 10,
        solvedProblems: 5,
        attemptedProblems: 7,
        progressPercentage: 50,
        submissions: [],
      };
      mockProblemService.getUserProgress.mockResolvedValue(expected);

      const result = await controller.getUserProgress(user);

      expect(mockProblemService.getUserProgress).toHaveBeenCalledWith('user-1');
      expect(result).toBe(expected);
    });
  });

  describe('getRecommendedProblems', () => {
    it('uses user id from @User() decorator', async () => {
      const user = { id: 'user-2' } as any;
      const expected: RecommendedResponseDto = {
        userId: 'user-2',
        recommendedCount: 1,
        recommendations: [],
      };
      mockProblemService.getRecommended.mockResolvedValue(expected);

      const result = await controller.getRecommendedProblems(user);

      expect(mockProblemService.getRecommended).toHaveBeenCalledWith('user-2');
      expect(result).toBe(expected);
    });
  });

  describe('getTrending', () => {
    it('returns trending problems', async () => {
      const expected: TrendingResponseDto = { trendingCount: 0, trending: [] };
      mockProblemService.getTrending.mockResolvedValue(expected);

      const result = await controller.getTrending();

      expect(mockProblemService.getTrending).toHaveBeenCalledTimes(1);
      expect(result).toBe(expected);
    });
  });

  describe('findOne', () => {
    it('fetches details by slug', async () => {
      const slug = 'two-sum';
      const expected: ProblemResponseDto = {
        id: '1',
        problemId: '1',
        title: 'Two Sum',
        difficulty: 'EASY',
        problemSlug: slug,
        description: 'Find two numbers',
        topics: [],
        similarProblems: [],
      };
      mockProblemService.findProblemBySlug.mockResolvedValue(expected);

      const result = await controller.findOne(slug);

      expect(mockProblemService.findProblemBySlug).toHaveBeenCalledWith(slug);
      expect(result).toBe(expected);
    });
  });

  describe('getStats', () => {
    it('fetches stats by slug', async () => {
      const slug = 'two-sum';
      const expected: ProblemStatsResponseDto = {
        totalSubmissions: 10,
        acceptedSubmissions: 5,
        acceptanceRate: 50,
        avgExecutionTime: 12,
        avgMemoryUsed: 32,
        updatedAt: new Date(),
      };
      mockProblemService.getProblemStats.mockResolvedValue(expected);

      const result = await controller.getStats(slug);

      expect(mockProblemService.getProblemStats).toHaveBeenCalledWith(slug);
      expect(result).toBe(expected);
    });
  });

  describe('getUserProblemSubmissions', () => {
    it('uses slug and user id from @User() decorator', async () => {
      const slug = 'two-sum';
      const user = { id: 'user-3' } as any;
      const expected: UserSubmissionDto = {
        userId: 'user-3',
        problemSlug: slug,
        totalAttempts: 0,
        status: 'pending',
        currentLanguage: 'python',
        attempts: [],
        bestAttempt: null,
        lastSubmittedAt: null,
      };
      mockProblemService.getUserProblemSubmissions.mockResolvedValue(expected);

      const result = await controller.getUserProblemSubmissions(slug, user);

      expect(mockProblemService.getUserProblemSubmissions).toHaveBeenCalledWith(
        slug,
        'user-3',
      );
      expect(result).toBe(expected);
    });
  });

  describe('create', () => {
    it('creates a problem via service', async () => {
      const dto = { title: 'Two Sum' };
      const expected = { id: '1', title: 'Two Sum' };
      mockProblemService.createProblem.mockResolvedValue(expected);

      const result = await controller.create(dto as any);

      expect(mockProblemService.createProblem).toHaveBeenCalledWith(dto);
      expect(result).toBe(expected);
    });
  });

  describe('update', () => {
    it('updates a problem via service', async () => {
      const id = '123';
      const dto = { title: 'Updated' };
      const expected = { id, title: 'Updated' };
      mockProblemService.updateProblem.mockResolvedValue(expected);

      const result = await controller.update(id, dto as any);

      expect(mockProblemService.updateProblem).toHaveBeenCalledWith(id, dto);
      expect(result).toBe(expected);
    });
  });

  describe('delete', () => {
    it('deletes a problem by id', async () => {
      const id = '123';
      const expected = { message: 'deleted', deletedId: id };
      mockProblemService.deleteProblem.mockResolvedValue(expected);

      const result = await controller.delete(id);

      expect(mockProblemService.deleteProblem).toHaveBeenCalledWith(id);
      expect(result).toBe(expected);
    });
  });
});
