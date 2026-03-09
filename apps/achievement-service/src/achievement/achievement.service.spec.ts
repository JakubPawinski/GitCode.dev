import { Test, TestingModule } from '@nestjs/testing';
import { AchievementService } from './achievement.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AchievementEventMapperService } from './achievement-event-mapper.service';
import { EventBus } from '@gitcode/messaging';
import axios from 'axios';
import { SubmissionCompletedEnvelope } from './events/envelopes';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AchievementService', () => {
  let service: AchievementService;
  let prismaMock: any;
  let configService: jest.Mocked<ConfigService>;
  let achievementEventMapperService: jest.Mocked<AchievementEventMapperService>;
  let eventBus: jest.Mocked<EventBus>;

  const mockAchievement = {
    id: '1',
    code: 'first_problem_solved',
    name: 'Algorithm Beginner',
    description: 'Solve your first problem',
    iconUrl: '/icons/first-problem.png',
    eventType: 'SUBMISSION_COMPLETED',
    targetValue: 1,
    createdAt: new Date(),
  };

  const mockUserId = '22a408d1-fa2f-48c3-a781-d35c3b838e23';
  const mockProblemId = 'f5b577fc-716e-4cda-bf31-32b5099fe792';

  beforeEach(async () => {
    prismaMock = {
      achievement: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      userAchievement: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
        count: jest.fn(),
      },
      userProgress: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        upsert: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AchievementService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: AchievementEventMapperService,
          useValue: {
            getAllEventTypesForSubmission: jest.fn(),
            mapSubmissionToAchievementEvents: jest.fn(),
          },
        },
        {
          provide: EventBus,
          useValue: {
            publish: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AchievementService>(AchievementService);
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
    achievementEventMapperService = module.get(
      AchievementEventMapperService,
    ) as jest.Mocked<AchievementEventMapperService>;
    eventBus = module.get(EventBus) as jest.Mocked<EventBus>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ========== CRUD TESTS ==========

  describe('getAchievements', () => {
    it('should return paginated achievements', async () => {
      const mockAchievements = [mockAchievement];
      const searchDto = {
        page: 1,
        limit: 10,
        sortBy: 'name' as const,
        sortOrder: 'asc' as const,
      };

      prismaMock.$transaction.mockResolvedValueOnce([mockAchievements, 1]);

      const result = await service.getAchievements(searchDto);

      expect(result.data).toHaveLength(1);
      expect(result.meta.totalItems).toBe(1);
      expect(result.meta.totalPages).toBe(1);
      expect(result.data[0].code).toBe('first_problem_solved');
    });

    it('should filter achievements by name', async () => {
      const searchDto = {
        page: 1,
        limit: 10,
        name: 'Algorithm',
        sortBy: 'name' as const,
        sortOrder: 'asc' as const,
      };

      prismaMock.$transaction.mockResolvedValueOnce([[mockAchievement], 1]);

      await service.getAchievements(searchDto);

      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('should return empty result when no achievements found', async () => {
      const searchDto = {
        page: 1,
        limit: 10,
        sortBy: 'name' as const,
        sortOrder: 'asc' as const,
      };

      prismaMock.$transaction.mockResolvedValueOnce([[], 0]);

      const result = await service.getAchievements(searchDto);

      expect(result.data).toHaveLength(0);
      expect(result.meta.totalItems).toBe(0);
    });
  });

  describe('createAchievement', () => {
    it('should create a new achievement', async () => {
      const postDto = {
        code: 'test_achievement',
        name: 'Test Achievement',
        describtion: 'Test Description',
        iconUrl: '/test.png',
        eventType: 'TEST_EVENT',
        targetValue: 5,
      };

      prismaMock.achievement.create.mockResolvedValueOnce(mockAchievement);

      const result = await service.createAchievement(postDto);

      expect(result.code).toBe('first_problem_solved');
      expect(prismaMock.achievement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          code: postDto.code,
          name: postDto.name,
          eventType: postDto.eventType,
        }),
      });
    });
  });

  describe('updateAchievement', () => {
    it('should update an existing achievement', async () => {
      const patchDto = {
        name: 'Updated Name',
        describtion: 'Updated Description',
        iconUrl: '/updated.png',
        eventType: 'UPDATED_EVENT',
        targetValue: 10,
      };

      const updatedAchievement = {
        ...mockAchievement,
        name: 'Updated Name',
        description: 'Updated Description',
        iconUrl: '/updated.png',
        eventType: 'UPDATED_EVENT',
        targetValue: 10,
      };

      prismaMock.achievement.update.mockResolvedValueOnce(updatedAchievement);

      const result = await service.updateAchievement('1', patchDto);

      expect(result.name).toBe('Updated Name');
      expect(result.describtion).toBe('Updated Description');
      expect(prismaMock.achievement.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          name: 'Updated Name',
          description: 'Updated Description',
          iconUrl: '/updated.png',
          eventType: 'UPDATED_EVENT',
          targetValue: 10,
        },
      });
    });
  });

  describe('deleteAchievement', () => {
    it('should delete an achievement', async () => {
      prismaMock.achievement.delete.mockResolvedValueOnce(mockAchievement);

      await service.deleteAchievement('1');

      expect(prismaMock.achievement.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('getAchievedAchievements', () => {
    it('should return user achievements', async () => {
      const mockUserAchievements = [
        {
          id: '1',
          userId: mockUserId,
          achievementId: '1',
          unlockedAt: new Date(),
          achievement: mockAchievement,
        },
      ];

      prismaMock.$transaction.mockResolvedValueOnce([mockUserAchievements, 1]);

      const result = await service.getAchievedAchievemnts(mockUserId, {
        page: 1,
        limit: 10,
        sortBy: 'name' as const,
        sortOrder: 'asc' as const,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].code).toBe('first_problem_solved');
    });
  });

  describe('getUserAchievementProgress', () => {
    it('should return user achievement progress', async () => {
      const mockProgress = [
        {
          id: '1',
          userId: mockUserId,
          achievementId: '1',
          currentProgress: 5,
          updatedAt: new Date(),
          achievement: mockAchievement,
        },
      ];

      prismaMock.$transaction.mockResolvedValueOnce([mockProgress, 1]);

      const result = await service.getUserAchievementProgress(mockUserId, {
        page: 1,
        limit: 10,
        sortBy: 'name' as const,
        sortOrder: 'asc' as const,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].progress).toBe(5);
    });
  });

  // ========== EVENT HANDLING TESTS ==========

  describe('handleSubmissionCompletedEvent', () => {
    const createSubmissionEnvelope = (
      overrides?: Partial<SubmissionCompletedEnvelope>,
    ): SubmissionCompletedEnvelope => ({
      event: 'submission.completed',
      eventId: '9f096f34-af41-4174-aaee-8622aeec0590',
      occurredOn: new Date().toISOString(),
      payload: {
        userId: mockUserId,
        submissionId: 'sub-1',
        code: 'function test() {}',
        language: 'javascript',
        problemId: mockProblemId,
        attemptId: 'att-1',
        problemDescription: 'Test Problem',
      },
      ...overrides,
    });

    it('should process submission completed event successfully', async () => {
      const envelope = createSubmissionEnvelope({
        payload: {
          userId: mockUserId,
          submissionId: 'sub-1',
          code: 'function test() {}',
          language: 'javascript',
          problemId: mockProblemId,
          attemptId: 'att-1',
          problemDescription: 'Test Problem - MEDIUM',
        },
      });

      configService.get.mockReturnValueOnce('http://problem-service');
      mockedAxios.get.mockResolvedValueOnce({
        data: { difficulty: 'MEDIUM' },
      });

      achievementEventMapperService.getAllEventTypesForSubmission.mockReturnValueOnce(
        [
          'SUBMISSION_COMPLETED',
          'SUBMISSION_COMPLETED_JAVASCRIPT',
          'SUBMISSION_COMPLETED_MEDIUM',
        ],
      );

      const mockTransaction = jest.fn(async (callback) => {
        return callback(prismaMock);
      });
      prismaMock.$transaction.mockImplementationOnce(mockTransaction);

      prismaMock.achievement.findMany.mockResolvedValueOnce([mockAchievement]);

      const mockUserProgress = {
        id: '1',
        userId: mockUserId,
        achievementId: '1',
        currentProgress: 1,
        updatedAt: new Date(),
      };

      prismaMock.userProgress.upsert.mockResolvedValueOnce(mockUserProgress);

      await service.handleSubmissionCompletedEvent(envelope);

      expect(
        achievementEventMapperService.getAllEventTypesForSubmission,
      ).toHaveBeenCalledWith('javascript', 'MEDIUM');
      expect(mockedAxios.get).toHaveBeenCalled();
    });

    it('should handle error when fetching problem details fails', async () => {
      const envelope = createSubmissionEnvelope();

      configService.get.mockReturnValueOnce('http://problem-service');
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        service.handleSubmissionCompletedEvent(envelope),
      ).rejects.toThrow('Failed to fetch problem details');
    });

    it('should unlock achievement when target value is reached', async () => {
      const envelope = createSubmissionEnvelope({
        payload: {
          userId: mockUserId,
          submissionId: 'sub-1',
          code: 'function test() {}',
          language: 'javascript',
          problemId: mockProblemId,
          attemptId: 'att-1',
          problemDescription: 'Test Problem - EASY',
        },
      });

      configService.get.mockReturnValueOnce('http://problem-service');
      mockedAxios.get.mockResolvedValueOnce({
        data: { difficulty: 'EASY' },
      });

      achievementEventMapperService.getAllEventTypesForSubmission.mockReturnValueOnce(
        ['SUBMISSION_COMPLETED'],
      );

      const mockTransaction = jest.fn(async (callback) => {
        return callback(prismaMock);
      });
      prismaMock.$transaction.mockImplementationOnce(mockTransaction);

      prismaMock.achievement.findMany.mockResolvedValueOnce([mockAchievement]);

      const mockUserProgress = {
        id: '1',
        userId: mockUserId,
        achievementId: '1',
        currentProgress: 1,
        updatedAt: new Date(),
      };

      prismaMock.userProgress.upsert.mockResolvedValueOnce(mockUserProgress);
      prismaMock.userAchievement.upsert.mockResolvedValueOnce({
        id: '1',
        userId: mockUserId,
        achievementId: '1',
        unlockedAt: new Date(),
      });

      await service.handleSubmissionCompletedEvent(envelope);

      expect(prismaMock.userAchievement.upsert).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalled();
    });

    it('should not unlock achievement when target value is not reached', async () => {
      const envelope = createSubmissionEnvelope();

      const achievementWithHighTarget = {
        ...mockAchievement,
        targetValue: 50,
      };

      configService.get.mockReturnValueOnce('http://problem-service');
      mockedAxios.get.mockResolvedValueOnce({
        data: { difficulty: 'MEDIUM' },
      });

      achievementEventMapperService.getAllEventTypesForSubmission.mockReturnValueOnce(
        ['SUBMISSION_COMPLETED'],
      );

      const mockTransaction = jest.fn(async (callback) => {
        return callback(prismaMock);
      });
      prismaMock.$transaction.mockImplementationOnce(mockTransaction);

      prismaMock.achievement.findMany.mockResolvedValueOnce([
        achievementWithHighTarget,
      ]);

      const mockUserProgress = {
        id: '1',
        userId: mockUserId,
        achievementId: '1',
        currentProgress: 1,
        updatedAt: new Date(),
      };

      prismaMock.userProgress.upsert.mockResolvedValueOnce(mockUserProgress);

      await service.handleSubmissionCompletedEvent(envelope);

      expect(prismaMock.userAchievement.upsert).not.toHaveBeenCalled();
    });

    it('should process multiple event types for single submission', async () => {
      const envelope = createSubmissionEnvelope({
        payload: {
          userId: mockUserId,
          submissionId: 'sub-1',
          code: 'function test() {}',
          language: 'python',
          problemId: mockProblemId,
          attemptId: 'att-1',
          problemDescription: 'Test Problem - HARD',
        },
      });

      configService.get.mockReturnValueOnce('http://problem-service');
      mockedAxios.get.mockResolvedValueOnce({
        data: { difficulty: 'HARD' },
      });

      const eventTypes = [
        'SUBMISSION_COMPLETED',
        'SUBMISSION_COMPLETED_PYTHON',
        'SUBMISSION_COMPLETED_HARD',
      ];

      achievementEventMapperService.getAllEventTypesForSubmission.mockReturnValueOnce(
        eventTypes,
      );

      const mockTransaction = jest.fn(async (callback) => {
        return callback(prismaMock);
      });
      prismaMock.$transaction.mockImplementation(mockTransaction);

      prismaMock.achievement.findMany.mockResolvedValue([mockAchievement]);

      const mockUserProgress = {
        id: '1',
        userId: mockUserId,
        achievementId: '1',
        currentProgress: 1,
        updatedAt: new Date(),
      };

      prismaMock.userProgress.upsert.mockResolvedValue(mockUserProgress);

      await service.handleSubmissionCompletedEvent(envelope);

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(3);
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
