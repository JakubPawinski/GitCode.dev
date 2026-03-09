import { Test, TestingModule } from '@nestjs/testing';
import { AchievementController } from './achievement.controller';
import { AchievementService } from './achievement.service';
import { JwtAuthGuard, PermissionsGuards } from '@gitcode/auth';
import { ResponseInterceptor } from '@gitcode/common';
import { GetAchievementDto } from './dtos/get-achievement.dto';
import { GetAchievementProgressDto } from './dtos/get-achievement-progress.dto';
import { PaginatedResult } from '@gitcode/types';

describe('AchievementController', () => {
  let controller: AchievementController;
  let service: jest.Mocked<AchievementService>;

  const mockAchievementDto: GetAchievementDto = {
    id: '1',
    code: 'first_problem_solved',
    name: 'Algorithm Beginner',
    description: 'Solve your first problem',
    iconUrl: '/icons/first-problem.png',
    eventType: 'SUBMISSION_COMPLETED',
    targetValue: 1,
  };

  const mockAchievementProgressDto: GetAchievementProgressDto = {
    id: '1',
    code: 'first_problem_solved',
    name: 'Algorithm Beginner',
    description: 'Solve your first problem',
    iconUrl: '/icons/first-problem.png',
    targetValue: 1,
    progress: 1,
    eventType: 'SUBMISSION_COMPLETED',
  };

  const mockUserId = '22a408d1-fa2f-48c3-a781-d35c3b838e23';

  const mockPaginatedResult: PaginatedResult<GetAchievementDto> = {
    data: [mockAchievementDto],
    meta: {
      totalItems: 1,
      totalPages: 1,
      currentPage: 1,
      pageSize: 10,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };

  const mockPaginatedProgressResult: PaginatedResult<GetAchievementProgressDto> =
    {
      data: [mockAchievementProgressDto],
      meta: {
        totalItems: 1,
        totalPages: 1,
        currentPage: 1,
        pageSize: 10,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AchievementController],
      providers: [
        {
          provide: AchievementService,
          useValue: {
            getAchievements: jest.fn(),
            getAchievedAchievements: jest.fn(),
            getUserAchievementProgress: jest.fn(),
            createAchievement: jest.fn(),
            updateAchievement: jest.fn(),
            deleteAchievement: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({})
      .overrideGuard(PermissionsGuards)
      .useValue({})
      .overrideInterceptor(ResponseInterceptor)
      .useValue({})
      .compile();

    controller = module.get<AchievementController>(AchievementController);
    service = module.get(AchievementService) as jest.Mocked<AchievementService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ========== GET TESTS ==========

  describe('getAchievements', () => {
    it('should return paginated achievements', async () => {
      const searchDto = {
        page: 1,
        limit: 10,
        sortBy: 'name' as const,
        sortOrder: 'asc' as const,
      };

      service.getAchievements.mockResolvedValueOnce(mockPaginatedResult);

      const result = await controller.getAchievements(searchDto);

      expect(result).toEqual(mockPaginatedResult);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].code).toBe('first_problem_solved');
      expect(service.getAchievements).toHaveBeenCalledWith(searchDto);
    });

    it('should filter achievements by name', async () => {
      const searchDto = {
        page: 1,
        limit: 10,
        name: 'Algorithm',
        sortBy: 'name' as const,
        sortOrder: 'asc' as const,
      };

      service.getAchievements.mockResolvedValueOnce(mockPaginatedResult);

      await controller.getAchievements(searchDto);

      expect(service.getAchievements).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Algorithm',
        }),
      );
    });

    it('should return empty result', async () => {
      const searchDto = {
        page: 1,
        limit: 10,
        sortBy: 'name' as const,
        sortOrder: 'asc' as const,
      };

      const emptyResult: PaginatedResult<GetAchievementDto> = {
        data: [],
        meta: {
          totalItems: 0,
          totalPages: 0,
          currentPage: 1,
          pageSize: 10,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      service.getAchievements.mockResolvedValueOnce(emptyResult);

      const result = await controller.getAchievements(searchDto);

      expect(result.data).toHaveLength(0);
      expect(result.meta.totalItems).toBe(0);
    });

    it('should handle pagination correctly', async () => {
      const searchDto = {
        page: 2,
        limit: 5,
        sortBy: 'createdAt' as const,
        sortOrder: 'desc' as const,
      };

      const paginatedResult: PaginatedResult<GetAchievementDto> = {
        data: [mockAchievementDto],
        meta: {
          totalItems: 15,
          totalPages: 3,
          currentPage: 2,
          pageSize: 5,
          hasNextPage: true,
          hasPreviousPage: true,
        },
      };

      service.getAchievements.mockResolvedValueOnce(paginatedResult);

      const result = await controller.getAchievements(searchDto);

      expect(result.meta.currentPage).toBe(2);
      expect(result.meta.totalPages).toBe(3);
      expect(service.getAchievements).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 5,
          sortOrder: 'desc',
        }),
      );
    });
  });

  describe('getUserAchievements', () => {
    it('should return user achievements', async () => {
      const searchDto = {
        page: 1,
        limit: 10,
        sortBy: 'name' as const,
        sortOrder: 'asc' as const,
      };

      service.getAchievedAchievements.mockResolvedValueOnce(mockPaginatedResult);

      const result = await controller.getUserAchievements(
        mockUserId,
        searchDto,
      );

      expect(result).toEqual(mockPaginatedResult);
      expect(service.getAchievedAchievements).toHaveBeenCalledWith(
        mockUserId,
        searchDto,
      );
    });

    it('should return empty result when user has no achievements', async () => {
      const searchDto = {
        page: 1,
        limit: 10,
        sortBy: 'name' as const,
        sortOrder: 'asc' as const,
      };

      const emptyResult: PaginatedResult<GetAchievementDto> = {
        data: [],
        meta: {
          totalItems: 0,
          totalPages: 0,
          currentPage: 1,
          pageSize: 10,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      service.getAchievedAchievements.mockResolvedValueOnce(emptyResult);

      const result = await controller.getUserAchievements(
        mockUserId,
        searchDto,
      );

      expect(result.data).toHaveLength(0);
    });

    it('should filter user achievements by name', async () => {
      const searchDto = {
        page: 1,
        limit: 10,
        name: 'Beginner',
        sortBy: 'name' as const,
        sortOrder: 'asc' as const,
      };

      service.getAchievedAchievements.mockResolvedValueOnce(mockPaginatedResult);

      await controller.getUserAchievements(mockUserId, searchDto);

      expect(service.getAchievedAchievements).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          name: 'Beginner',
        }),
      );
    });

    it('should handle different user IDs', async () => {
      const differentUserId = 'different-user-id';
      const searchDto = {
        page: 1,
        limit: 10,
        sortBy: 'name' as const,
        sortOrder: 'asc' as const,
      };

      service.getAchievedAchievements.mockResolvedValueOnce(mockPaginatedResult);

      await controller.getUserAchievements(differentUserId, searchDto);

      expect(service.getAchievedAchievements).toHaveBeenCalledWith(
        differentUserId,
        searchDto,
      );
    });
  });

  describe('getUserAchievementProgress', () => {
    it('should return user achievement progress', async () => {
      const searchDto = {
        page: 1,
        limit: 10,
        sortBy: 'name' as const,
        sortOrder: 'asc' as const,
      };

      service.getUserAchievementProgress.mockResolvedValueOnce(
        mockPaginatedProgressResult,
      );

      const result = await controller.getUserAchievementProgress(
        mockUserId,
        searchDto,
      );

      expect(result).toEqual(mockPaginatedProgressResult);
      expect(result.data[0].progress).toBe(1);
      expect(service.getUserAchievementProgress).toHaveBeenCalledWith(
        mockUserId,
        searchDto,
      );
    });

    it('should return empty progress when user has no progress', async () => {
      const searchDto = {
        page: 1,
        limit: 10,
        sortBy: 'name' as const,
        sortOrder: 'asc' as const,
      };

      const emptyResult: PaginatedResult<GetAchievementProgressDto> = {
        data: [],
        meta: {
          totalItems: 0,
          totalPages: 0,
          currentPage: 1,
          pageSize: 10,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      service.getUserAchievementProgress.mockResolvedValueOnce(emptyResult);

      const result = await controller.getUserAchievementProgress(
        mockUserId,
        searchDto,
      );

      expect(result.data).toHaveLength(0);
    });

    it('should show progress towards achievements', async () => {
      const searchDto = {
        page: 1,
        limit: 10,
        sortBy: 'name' as const,
        sortOrder: 'asc' as const,
      };

      const progressResult: PaginatedResult<GetAchievementProgressDto> = {
        data: [
          {
            ...mockAchievementProgressDto,
            eventType: 'SUBMISSION_COMPLETED',
            targetValue: 50,
            progress: 25,
          },
        ],
        meta: {
          totalItems: 1,
          totalPages: 1,
          currentPage: 1,
          pageSize: 10,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      service.getUserAchievementProgress.mockResolvedValueOnce(progressResult);

      const result = await controller.getUserAchievementProgress(
        mockUserId,
        searchDto,
      );

      expect(result.data[0].progress).toBe(25);
      expect(result.data[0].targetValue).toBe(50);
    });
  });

  // ========== POST TESTS ==========

  describe('createAchievement', () => {
    it('should create a new achievement', async () => {
      const postDto = {
        code: 'test_achievement',
        name: 'Test Achievement',
        description: 'Test Description',
        iconUrl: '/test.png',
        eventType: 'TEST_EVENT',
        targetValue: 5,
      };

      service.createAchievement.mockResolvedValueOnce(mockAchievementDto);

      const result = await controller.createAchievement(postDto);

      expect(result).toEqual(mockAchievementDto);
      expect(service.createAchievement).toHaveBeenCalledWith(postDto);
    });

    it('should validate required fields', async () => {
      const postDto = {
        code: 'test_achievement',
        name: 'Test Achievement',
        description: 'Test Description',
        iconUrl: '/test.png',
        eventType: 'TEST_EVENT',
        targetValue: 5,
      };

      service.createAchievement.mockResolvedValueOnce(mockAchievementDto);

      await controller.createAchievement(postDto);

      expect(service.createAchievement).toHaveBeenCalledWith(
        expect.objectContaining({
          code: expect.any(String),
          name: expect.any(String),
        }),
      );
    });

    it('should return created achievement with all fields', async () => {
      const postDto = {
        code: 'new_achievement',
        name: 'New Achievement',
        description: 'New Description',
        iconUrl: '/new.png',
        eventType: 'NEW_EVENT',
        targetValue: 10,
      };

      const createdAchievement: GetAchievementDto = {
        id: 'new-id',
        ...postDto,
      };

      service.createAchievement.mockResolvedValueOnce(createdAchievement);

      const result = await controller.createAchievement(postDto);

      expect(result.id).toBeDefined();
      expect(result.code).toBe('new_achievement');
      expect(result.targetValue).toBe(10);
    });
  });

  // ========== PATCH TESTS ==========

  describe('updateAchievement', () => {
    it('should update an achievement', async () => {
      const id = '1';
      const patchDto = {
        name: 'Updated Name',
        describtion: 'Updated Description',
        targetValue: 20,
      };

      const updatedAchievement: GetAchievementDto = {
        ...mockAchievementDto,
        ...patchDto,
      };

      service.updateAchievement.mockResolvedValueOnce(updatedAchievement);

      const result = await controller.updateAchievement(id, patchDto);

      expect(result).toEqual(updatedAchievement);
      expect(result.name).toBe('Updated Name');
      expect(result.targetValue).toBe(20);
      expect(service.updateAchievement).toHaveBeenCalledWith(id, patchDto);
    });

    it('should support partial updates', async () => {
      const id = '1';
      const patchDto = {
        name: 'Only Name Updated',
      };

      const updatedAchievement: GetAchievementDto = {
        ...mockAchievementDto,
        name: 'Only Name Updated',
      };

      service.updateAchievement.mockResolvedValueOnce(updatedAchievement);

      const result = await controller.updateAchievement(id, patchDto);

      expect(result.name).toBe('Only Name Updated');
      expect(result.description).toBe(mockAchievementDto.description);
    });

    it('should update multiple fields', async () => {
      const id = '1';
      const patchDto = {
        name: 'New Name',
        describtion: 'New Description',
        iconUrl: '/new-icon.png',
        targetValue: 50,
      };

      const updatedAchievement: GetAchievementDto = {
        ...mockAchievementDto,
        ...patchDto,
      };

      service.updateAchievement.mockResolvedValueOnce(updatedAchievement);

      const result = await controller.updateAchievement(id, patchDto);

      expect(result.name).toBe('New Name');
      expect(result.iconUrl).toBe('/new-icon.png');
      expect(result.targetValue).toBe(50);
    });
  });

  // ========== DELETE TESTS ==========

  describe('deleteAchievement', () => {
    it('should delete an achievement', async () => {
      const id = '1';

      service.deleteAchievement.mockResolvedValueOnce(undefined);

      await controller.deleteAchievement(id);

      expect(service.deleteAchievement).toHaveBeenCalledWith(id);
    });

    it('should handle deletion of non-existent achievement', async () => {
      const id = 'non-existent-id';

      service.deleteAchievement.mockResolvedValueOnce(undefined);

      await controller.deleteAchievement(id);

      expect(service.deleteAchievement).toHaveBeenCalledWith(id);
    });

    it('should delete achievement by correct ID', async () => {
      const id = '123-456-789';

      service.deleteAchievement.mockResolvedValueOnce(undefined);

      await controller.deleteAchievement(id);

      expect(service.deleteAchievement).toHaveBeenCalledWith(id);
      expect(service.deleteAchievement).toHaveBeenCalledTimes(1);
    });
  });

  // ========== GENERAL TESTS ==========

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have all required methods', () => {
    expect(controller.getAchievements).toBeDefined();
    expect(controller.getUserAchievements).toBeDefined();
    expect(controller.getUserAchievementProgress).toBeDefined();
    expect(controller.createAchievement).toBeDefined();
    expect(controller.updateAchievement).toBeDefined();
    expect(controller.deleteAchievement).toBeDefined();
  });
});
