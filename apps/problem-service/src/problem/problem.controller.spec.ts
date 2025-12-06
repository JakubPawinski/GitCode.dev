import { Test, TestingModule } from '@nestjs/testing';
import { ProblemController } from './problem.controller';
import { ProblemService } from './problem.service';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: jest.fn(),
}));
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
      const paginationDto: Paginaiton = { page: 2, limit: 5 };
      const expected = {
        data: [],
        pagination: {
          page: 2,
          limit: 5,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: true,
        },
      };
      mockProblemService.getPaginatedProblems.mockResolvedValue(expected);

      const result = await controller.findAll(paginationDto as any);

      expect(mockProblemService.getPaginatedProblems).toHaveBeenCalledWith(
        paginationDto,
      );
      expect(result).toBe(expected);
    });
  });

  describe('getUserProgress', () => {
    it('uses user id from request', async () => {
      const req = { user: { id: 'user-1' } };
      const expected = {
        userId: 'user-1',
        totalProblems: 10,
        solvedProblems: 5,
        attemptedProblems: 7,
        progressPercentage: 50,
        submissions: [],
      };
      mockProblemService.getUserProgress.mockResolvedValue(expected);

      const result = await controller.getUserProgress(req as any);

      expect(mockProblemService.getUserProgress).toHaveBeenCalledWith('user-1');
      expect(result).toBe(expected);
    });
  });

  describe('getRecommendedProblems', () => {
    it('uses user id to fetch recommendations', async () => {
      const req = { user: { id: 'user-2' } };
      const expected = {
        userId: 'user-2',
        recommendedCount: 1,
        recommendations: [],
      };
      mockProblemService.getRecommended.mockResolvedValue(expected);

      const result = await controller.getRecommendedProblems(req as any);

      expect(mockProblemService.getRecommended).toHaveBeenCalledWith('user-2');
      expect(result).toBe(expected);
    });
  });

  describe('search', () => {
    it('passes query and pagination to service', async () => {
      const paginationDto = { page: 1, limit: 10 };
      const expected = {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
      mockProblemService.searchProblems.mockResolvedValue(expected);

      const result = await controller.search('graph', paginationDto as any);

      expect(mockProblemService.searchProblems).toHaveBeenCalledWith(
        'graph',
        paginationDto,
      );
      expect(result).toBe(expected);
    });
  });

  describe('getTrending', () => {
    it('returns trending problems', async () => {
      const expected = { trendingCount: 0, trending: [] };
      mockProblemService.getTrending.mockResolvedValue(expected);

      const result = await controller.getTrending();

      expect(mockProblemService.getTrending).toHaveBeenCalledTimes(1);
      expect(result).toBe(expected);
    });
  });

  describe('findOne', () => {
    it('fetches details by slug', async () => {
      const slug = 'two-sum';
      const expected = { id: '1', problemSlug: slug };
      mockProblemService.findProblemBySlug.mockResolvedValue(expected);

      const result = await controller.findOne(slug);

      expect(mockProblemService.findProblemBySlug).toHaveBeenCalledWith(slug);
      expect(result).toBe(expected);
    });
  });

  describe('getStats', () => {
    it('fetches stats by slug', async () => {
      const slug = 'two-sum';
      const expected = {
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
    it('uses slug and user id', async () => {
      const slug = 'two-sum';
      const req = { user: { id: 'user-3' } };
      const expected = {
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

      const result = await controller.getUserProblemSubmissions(
        slug,
        req as any,
      );

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
