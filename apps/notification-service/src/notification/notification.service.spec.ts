import { Test, TestingModule } from '@nestjs/testing';
import { Logger, NotFoundException } from '@nestjs/common';
import { NotificationService } from './providers/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { EventBus } from '@gitcode/messaging';
import { ChannelType, NotificationType } from '@prisma/client-notification';
import { NotificationKind } from './enums';
import { PaginationQueryDto } from '@gitcode/common';

describe('NotificationService', () => {
  let service: NotificationService;

  const mockPrismaService = {
    notificationConfig: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    notificationPreference: {
      findMany: jest.fn().mockResolvedValue([]),
      upsert: jest.fn().mockResolvedValue({}),
    },
    notification: {
      create: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findFirst: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({}),
    },
  };

  const mockRealtimeService = {
    broadcastEvent: jest.fn().mockResolvedValue(true),
  };

  const mockEventBus = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RealtimeService, useValue: mockRealtimeService },
        { provide: EventBus, useValue: mockEventBus },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);

    // Suppress logs during testing
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize and refresh config cache', async () => {
      const mockConfigs = [
        {
          type: NotificationType.SYSTEM,
          kind: NotificationKind.USER_BANNED,
          isMandatory: true,
        },
      ];
      mockPrismaService.notificationConfig.findMany.mockResolvedValueOnce(
        mockConfigs,
      );

      await service.onModuleInit();

      expect(mockPrismaService.notificationConfig.findMany).toHaveBeenCalled();
      // Test if isMandatoryNotification works correctly based on cache
      const isMandatory = (service as any).isMandatoryNotification(
        NotificationType.SYSTEM,
        NotificationKind.USER_BANNED,
      );
      expect(isMandatory).toBe(true);
    });
  });

  describe('getHealth', () => {
    it('should return ok status', () => {
      expect(service.getHealth()).toEqual({ status: 'ok' });
    });
  });

  describe('notify', () => {
    const userId = 'test-user-id';
    const payload: any = { message: 'success', title: 'test' };

    beforeEach(() => {
      jest.spyOn(service, 'getUserPreferences').mockResolvedValue({
        preferences: [
          { type: NotificationType.SYSTEM, channels: [ChannelType.IN_APP] },
        ],
      });
      // Need a full mock object returned by prisma
      mockPrismaService.notification.create.mockResolvedValue({
        id: 'notif-1',
        userId,
        severity: 'INFO',
        kind: NotificationKind.USER_PROFILE_UPDATED,
        type: NotificationType.SYSTEM,
        channelsSent: [ChannelType.IN_APP],
        payload,
        createdAt: new Date(),
        updatedAt: new Date(),
        isRead: false,
      });
    });

    it('should process and save notification when user has valid preferences', async () => {
      await service.notify({
        userId,
        type: NotificationType.SYSTEM,
        kind: NotificationKind.USER_PROFILE_UPDATED,
        severity: 'INFO',
        payload,
      });

      expect(service.getUserPreferences).toHaveBeenCalledWith(userId);
      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          type: NotificationType.SYSTEM,
          kind: NotificationKind.USER_PROFILE_UPDATED,
          channelsSent: [ChannelType.IN_APP],
        }),
      });
      expect(mockRealtimeService.broadcastEvent).toHaveBeenCalledWith(
        userId,
        'notification',
        expect.any(Object),
      );
    });

    it('should add EMAIL channel if notification is mandatory', async () => {
      // Mock that this combination is mandatory
      service['configCache'].set(
        `${NotificationType.SYSTEM}:${NotificationKind.USER_BANNED}`,
        true,
      );

      jest.spyOn(service, 'getUserPreferences').mockResolvedValue({
        preferences: [
          { type: NotificationType.SYSTEM, channels: [ChannelType.IN_APP] },
        ],
      });

      mockPrismaService.notification.create.mockResolvedValueOnce({
        id: 'notif-2',
        userId,
        severity: 'HIGH',
        kind: NotificationKind.USER_BANNED,
        type: NotificationType.SYSTEM,
        channelsSent: [ChannelType.IN_APP, ChannelType.EMAIL],
        payload: { message: 'test', title: 'test' },
        createdAt: new Date(),
        updatedAt: new Date(),
        isRead: false,
      });

      await service.notify({
        userId,
        type: NotificationType.SYSTEM,
        kind: NotificationKind.USER_BANNED,
        severity: 'INFO',
        payload: { message: 'test', title: 'test' },
      });

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          channelsSent: [ChannelType.IN_APP, ChannelType.EMAIL],
        }),
      });
    });

    it('should not process if no channels are configured and it is not mandatory', async () => {
      jest.spyOn(service, 'getUserPreferences').mockResolvedValue({
        preferences: [
          { type: NotificationType.SYSTEM, channels: [] }, // No channels assigned
        ],
      });

      await service.notify({
        userId,
        type: NotificationType.SYSTEM,
        kind: NotificationKind.USER_PROFILE_UPDATED,
        severity: 'INFO',
        payload,
      });

      expect(mockPrismaService.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('getUserPreferences', () => {
    it('should load and map preferences correctly', async () => {
      mockPrismaService.notificationPreference.findMany.mockResolvedValueOnce([
        {
          type: NotificationType.SYSTEM,
          channels: [ChannelType.IN_APP, ChannelType.EMAIL],
        },
      ]);

      const result = await service.getUserPreferences('user-1');

      expect(
        mockPrismaService.notificationPreference.findMany,
      ).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(result).toEqual({
        preferences: [
          {
            type: NotificationType.SYSTEM,
            channels: [ChannelType.IN_APP, ChannelType.EMAIL],
          },
        ],
      });
    });

    it('should set default preferences if none found', async () => {
      mockPrismaService.notificationPreference.findMany.mockResolvedValueOnce(
        [],
      ); // First attempt
      jest.spyOn(service, 'setDefaultPreferences').mockResolvedValueOnce({
        preferences: [],
      });

      const result = await service.getUserPreferences('user-1');

      expect(service.setDefaultPreferences).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({ preferences: [] });
    });
  });

  describe('getAllNotifications', () => {
    it('should return paginated notifications', async () => {
      mockPrismaService.notification.findMany.mockResolvedValueOnce([
        { id: '1', payload: { message: 'test', title: 'test' } },
      ]);
      mockPrismaService.notification.count.mockResolvedValueOnce(1);

      const result = await service.getAllNotifications('user-1', {
        page: 1,
        limit: 10,
      } as PaginationQueryDto);

      expect(result.meta.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('1');
    });
  });

  describe('getUnreadNotifications', () => {
    it('should return paginated unread notifications', async () => {
      mockPrismaService.notification.findMany.mockResolvedValueOnce([
        { id: '2', isRead: false, payload: { message: 'test', title: 'test' } },
      ]);
      mockPrismaService.notification.count.mockResolvedValueOnce(1);

      const result = await service.getUnreadNotifications('user-1', {
        page: 1,
        limit: 10,
      } as PaginationQueryDto);

      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1', isRead: false } }),
      );
      expect(result.meta.totalItems).toBe(1);
      expect(result.data[0].id).toBe('2');
    });
  });

  describe('getUnreadNotificationCount', () => {
    it('should return count of unread notifications', async () => {
      mockPrismaService.notification.count.mockResolvedValueOnce(5);

      const result = await service.getUnreadNotificationCount('user-1');

      expect(mockPrismaService.notification.count).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
      });
      expect(result).toBe(5);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      mockPrismaService.notification.findFirst.mockResolvedValueOnce({
        id: 'notif-1',
        userId: 'user-1',
      });
      mockPrismaService.notification.update.mockResolvedValueOnce({
        id: 'notif-1',
        isRead: true,
        payload: { message: 'test', title: 'test' },
      });

      const result = await service.markAsRead('user-1', 'notif-1');

      expect(mockPrismaService.notification.findFirst).toHaveBeenCalledWith({
        where: { id: 'notif-1', userId: 'user-1' },
      });
      expect(mockPrismaService.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { isRead: true },
      });
      expect(result.isRead).toBe(true);
    });

    it('should throw NotFoundException if notification not found', async () => {
      mockPrismaService.notification.findFirst.mockResolvedValueOnce(null);

      await expect(service.markAsRead('user-1', 'invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
