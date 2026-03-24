import { Test, TestingModule } from '@nestjs/testing';
import { NotificationConsumer } from './notification.consumer';
import { NotificationService } from './providers/notification.service';
import {
  NotificationSeverity,
  NotificationType,
} from '@prisma/client-notification';
import { NotificationKind } from './enums/index';
import { Logger } from '@nestjs/common';

describe('NotificationConsumer', () => {
  let consumer: NotificationConsumer;
  let notificationService: NotificationService;

  const mockNotificationService = {
    notify: jest.fn().mockResolvedValue(undefined),
    setDefaultPreferences: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationConsumer],
      providers: [
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    consumer = module.get<NotificationConsumer>(NotificationConsumer);
    notificationService = module.get<NotificationService>(NotificationService);

    // Suppress logs during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(consumer).toBeDefined();
  });

  describe('handleCreateNotification', () => {
    it('should map the command payload to NotifyParams and call notify', async () => {
      const mockCmd: any = {
        payload: {
          userId: 'user1',
          type: NotificationType.SYSTEM,
          kind: NotificationKind.USER_PROFILE_UPDATED,
          severity: NotificationSeverity.INFO,
          payload: { message: 'Test message', title: 'Test title' },
        },
      };

      await consumer.handleCreateNotification(mockCmd);

      expect(notificationService.notify).toHaveBeenCalledWith({
        userId: 'user1',
        type: NotificationType.SYSTEM,
        kind: NotificationKind.USER_PROFILE_UPDATED,
        severity: NotificationSeverity.INFO,
        payload: { message: 'Test message', title: 'Test title' },
      });
    });
  });

  describe('handleUserCreated', () => {
    it('should call setDefaultPreferences on UserCreated trigger', async () => {
      const mockEvent: any = {
        payload: {
          userId: 'new-user',
        },
      };

      await consumer.handleUserCreated(mockEvent);

      expect(notificationService.setDefaultPreferences).toHaveBeenCalledWith(
        'new-user',
      );
    });

    it('should catch exceptions and not throw', async () => {
      mockNotificationService.setDefaultPreferences.mockRejectedValueOnce(
        new Error('Failed!'),
      );
      const mockEvent: any = {
        payload: {
          userId: 'new-user',
        },
      };

      await expect(
        consumer.handleUserCreated(mockEvent),
      ).resolves.not.toThrow();
    });
  });

  describe('handleUserBanned', () => {
    it('should send a USER_BANNED notification', async () => {
      const mockEvent: any = {
        payload: {
          userId: 'banned-user',
          reason: 'Test reason',
          bannedAt: new Date('2023-01-01'),
        },
      };

      await consumer.handleUserBanned(mockEvent);

      expect(notificationService.notify).toHaveBeenCalledWith({
        userId: 'banned-user',
        type: NotificationType.SYSTEM,
        kind: NotificationKind.USER_BANNED,
        severity: NotificationSeverity.ERROR,
        payload: {
          title: 'Account Banned',
          message: `Your account has been banned for the following reason: Test reason`,
          reason: 'Test reason',
          bannedAt: mockEvent.payload.bannedAt,
        },
      });
    });
  });

  describe('handleUserProfileUpdated', () => {
    it('should send a USER_PROFILE_UPDATED notification', async () => {
      const mockEvent: any = {
        payload: {
          userId: 'profile-user',
        },
      };

      await consumer.handleUserProfileUpdated(mockEvent);

      expect(notificationService.notify).toHaveBeenCalledWith({
        userId: 'profile-user',
        type: NotificationType.SYSTEM,
        kind: NotificationKind.USER_PROFILE_UPDATED,
        severity: NotificationSeverity.INFO,
        payload: {
          title: 'Profile Updated',
          message: 'Your user profile has been successfully updated.',
        },
      });
    });
  });

  describe('handleSoftDeleted', () => {
    it('should send a USER_SOFT_DELETED notification', async () => {
      const mockEvent: any = {
        payload: {
          userId: 'deleted-user',
        },
      };

      await consumer.handleSoftDeleted(mockEvent);

      expect(notificationService.notify).toHaveBeenCalledWith({
        userId: 'deleted-user',
        type: NotificationType.SYSTEM,
        kind: NotificationKind.USER_SOFT_DELETED,
        severity: NotificationSeverity.WARNING,
        payload: {
          title: 'Account Soft Deleted',
          message: 'Your account has been soft deleted.',
        },
      });
    });
  });

  describe('handleFriendshipAccepted', () => {
    it('should notify both addressee and requester', async () => {
      const mockEvent: any = {
        payload: {
          addresseeId: 'addressee',
          requesterId: 'requester',
          addresseeUsername: 'AddresseeUser',
          requesterUsername: 'RequesterUser',
          requestId: 'req-id',
        },
      };

      await consumer.handleFriendshipAccepted(mockEvent);

      expect(notificationService.notify).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'addressee' }),
      );
      expect(notificationService.notify).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'requester' }),
      );
      expect(notificationService.notify).toHaveBeenCalledTimes(2);
    });
  });

  describe('handleFriendshipDeclined', () => {
    it('should notify both addressee and requester', async () => {
      const mockEvent: any = {
        payload: {
          addresseeId: 'addressee',
          requesterId: 'requester',
          addresseeUsername: 'AddresseeUser',
          requesterUsername: 'RequesterUser',
          requestId: 'req-id',
        },
      };

      await consumer.handleFriendshipDeclined(mockEvent);

      expect(notificationService.notify).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'addressee' }),
      );
      expect(notificationService.notify).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'requester' }),
      );
      expect(notificationService.notify).toHaveBeenCalledTimes(2);
    });
  });

  describe('handleFriendshipRequested', () => {
    it('should notify both addressee and requester', async () => {
      const mockEvent: any = {
        payload: {
          addresseeId: 'addressee',
          requesterId: 'requester',
          addresseeUsername: 'AddresseeUser',
          requesterUsername: 'RequesterUser',
          requestId: 'req-id',
        },
      };

      await consumer.handleFriendshipRequested(mockEvent);

      expect(notificationService.notify).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'addressee' }),
      );
      expect(notificationService.notify).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'requester' }),
      );
      expect(notificationService.notify).toHaveBeenCalledTimes(2);
    });
  });

  describe('handleSubmissionAnalyzed', () => {
    it('should send SUBMISSION_ANALYZED notification', async () => {
      const mockEvent: any = {
        payload: {
          userId: 'user1',
          attemptId: 'attempt1',
        },
      };

      await consumer.handleSubmissionAnalyzed(mockEvent);

      expect(notificationService.notify).toHaveBeenCalledWith({
        userId: 'user1',
        type: NotificationType.SYSTEM,
        kind: NotificationKind.SUBMISSION_ANALYZED,
        severity: NotificationSeverity.INFO,
        payload: {
          title: 'Submission Analyzed',
          message: 'Your submission has been analyzed.',
          attemptId: 'attempt1',
        },
      });
    });
  });

  describe('handleSubmissionCompleted', () => {
    it('should send SUBMISSION_COMPLETED notification', async () => {
      const mockEvent: any = {
        payload: {
          userId: 'user1',
        },
      };

      await consumer.handleSubmissionCompleted(mockEvent);

      expect(notificationService.notify).toHaveBeenCalledWith({
        userId: 'user1',
        type: NotificationType.SYSTEM,
        kind: NotificationKind.SUBMISSION_COMPLETED,
        severity: NotificationSeverity.INFO,
        payload: {
          title: 'Problem Solved',
          message: 'Congratulations! You have solved the problem.',
        },
      });
    });
  });

  describe('handleSubmissionFailed', () => {
    it('should send SUBMISSION_FAILED notification', async () => {
      const mockEvent: any = {
        payload: {
          userId: 'user1',
        },
      };

      await consumer.handleSubmissionFailed(mockEvent);

      expect(notificationService.notify).toHaveBeenCalledWith({
        userId: 'user1',
        type: NotificationType.SYSTEM,
        kind: NotificationKind.SUBMISSION_FAILED,
        severity: NotificationSeverity.ERROR,
        payload: {
          title: 'Submission Failed',
          message: 'Your submission has failed for the following reason',
        },
      });
    });
  });
});
