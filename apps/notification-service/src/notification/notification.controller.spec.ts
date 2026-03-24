import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from './providers/notification.service';
import { RealtimeService } from '../realtime/realtime.service';
import { UUID, AuthenticatedUser, AppRole } from '@gitcode/types';
import { PaginationQueryDto } from '@gitcode/common';
import { JwtAuthGuard, PermissionsGuards } from '@gitcode/auth';

describe('NotificationController', () => {
  let controller: NotificationController;
  let notificationService: NotificationService;
  let realtimeService: RealtimeService;

  const mockUser: AuthenticatedUser = {
    id: 'user-id-123',
    email: 'test@example.com',
    roles: [AppRole.USER],
    permissions: [],
    username: 'testuser',
  };

  const mockNotificationService = {
    getHealth: jest.fn().mockReturnValue({ status: 'ok' }),
    getUserPreferences: jest.fn().mockResolvedValue({ preferences: [] }),
    sendCommandNotification: jest.fn().mockResolvedValue({ success: true }),
    updateUserPreferences: jest.fn().mockResolvedValue({ preferences: [] }),
    setDefaultPreferences: jest.fn().mockResolvedValue({ preferences: [] }),
    getAllNotifications: jest.fn().mockResolvedValue({ data: [], meta: {} }),
    getUnreadNotifications: jest.fn().mockResolvedValue({ data: [], meta: {} }),
    getUnreadNotificationCount: jest.fn().mockResolvedValue(5),
    markAllAsRead: jest.fn().mockResolvedValue({ success: true }),
    markAsRead: jest.fn().mockResolvedValue({ id: 'notif-1', isRead: true }),
    getNotificationById: jest.fn().mockResolvedValue({ id: 'notif-1' }),
  };

  const mockRealtimeService = {
    getUserStream: jest.fn().mockReturnValue('mock-stream'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
        {
          provide: RealtimeService,
          useValue: mockRealtimeService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuards)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<NotificationController>(NotificationController);
    notificationService = module.get<NotificationService>(NotificationService);
    realtimeService = module.get<RealtimeService>(RealtimeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHealth', () => {
    it('should return health status', () => {
      expect(controller.getHealth()).toEqual({ status: 'ok' });
      expect(notificationService.getHealth).toHaveBeenCalled();
    });
  });

  describe('streamNotifications', () => {
    it('should return a user stream', () => {
      const result = controller.streamNotifications({ id: 'user-id-123' });
      expect(result).toBe('mock-stream');
      expect(realtimeService.getUserStream).toHaveBeenCalledWith('user-id-123');
    });
  });

  describe('getPreferences', () => {
    it('should return user preferences', async () => {
      const result = await controller.getPreferences(mockUser);
      expect(result).toEqual({ preferences: [] });
      expect(notificationService.getUserPreferences).toHaveBeenCalledWith(
        mockUser.id,
      );
    });
  });

  describe('sendTestNotification', () => {
    it('should send a test notification', async () => {
      const result = await controller.sendTestNotification('test-user-id');
      expect(result).toEqual({ success: true });
      expect(notificationService.sendCommandNotification).toHaveBeenCalledWith(
        'test-user-id',
      );
    });
  });

  describe('updatePreferences', () => {
    it('should update user preferences', async () => {
      const dto = {};
      const result = await controller.updatePreferences(mockUser, dto);
      expect(result).toEqual({ preferences: [] });
      expect(notificationService.updateUserPreferences).toHaveBeenCalledWith(
        mockUser.id,
        dto,
      );
    });
  });

  describe('createDefaultPreferences', () => {
    it('should create default preferences', async () => {
      const result = await controller.createDefaultPreferences(mockUser);
      expect(result).toEqual({ preferences: [] });
      expect(notificationService.setDefaultPreferences).toHaveBeenCalledWith(
        mockUser.id,
      );
    });
  });

  describe('getAllNotifications', () => {
    it('should return all notifications', async () => {
      const query = { page: 1, limit: 10 } as PaginationQueryDto;
      const result = await controller.getAllNotifications(query, mockUser);
      expect(result).toEqual({ data: [], meta: {} });
      expect(notificationService.getAllNotifications).toHaveBeenCalledWith(
        mockUser.id,
        query,
      );
    });
  });

  describe('getUnreadNotifications', () => {
    it('should return unread notifications', async () => {
      const result = await controller.getUnreadNotifications(mockUser);
      expect(result).toEqual({ data: [], meta: {} });
      expect(notificationService.getUnreadNotifications).toHaveBeenCalledWith(
        mockUser.id,
      );
    });
  });

  describe('getUnreadNotificationCount', () => {
    it('should return count of unread notifications', async () => {
      const result = await controller.getUnreadNotificationCount(mockUser);
      expect(result).toBe(5);
      expect(
        notificationService.getUnreadNotificationCount,
      ).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      const result = await controller.markAllAsRead(mockUser);
      expect(result).toEqual({ success: true });
      expect(notificationService.markAllAsRead).toHaveBeenCalledWith(
        mockUser.id,
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark a specific notification as read', async () => {
      const notifId = 'notif-1' as UUID;
      const result = await controller.markAsRead(mockUser, notifId);
      expect(result).toEqual({ id: 'notif-1', isRead: true });
      expect(notificationService.markAsRead).toHaveBeenCalledWith(
        mockUser.id,
        notifId,
      );
    });
  });

  describe('getNotificationById', () => {
    it('should get a notification by ID', async () => {
      const notifId = 'notif-1' as UUID;
      const result = await controller.getNotificationById(mockUser, notifId);
      expect(result).toEqual({ id: 'notif-1' });
      expect(notificationService.getNotificationById).toHaveBeenCalledWith(
        mockUser.id,
        notifId,
      );
    });
  });
});
