import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeService } from '../../realtime/realtime.service';
import { ChannelType, NotificationType } from '@prisma/client-notification';
import { PaginatedResult, UUID } from '@gitcode/types';
import {
  GetNotificationPreferencesDto,
  UpdateNotificationPreferencesDto,
} from '../dtos';
import { PostNotificationDto, GetNotificationDto } from '../dtos/index';
import { NotificationKind } from '../enums';
import type { NotificationPayload } from '../types/index';
import { NotifyParams } from '../interfaces';
import { PaginationQueryDto } from '@gitcode/common';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  constructor(
    private readonly prismaService: PrismaService,
    private readonly realtimeService: RealtimeService,
  ) {}

  // TODO - implement proper health check logic
  public getHealth() {
    return { status: 'ok' };
  }

  /*
   * Process and send notification based on user preferences
   */
  public async processNotification(dto: PostNotificationDto) {
    this.logger.log(`Processing notification for user ${dto.userId}: ${dto}`);

    const savedNotification = await this.saveNotificationToDb(dto);

    const promises = [];
    const { channelsSent } = savedNotification;

    if (channelsSent.includes(ChannelType.IN_APP)) {
      promises.push(this.sendInApp(savedNotification));
    }
    if (channelsSent.includes(ChannelType.EMAIL)) {
      this.logger.warn('[MOCK] Sending EMAIL notification');
      promises.push();
    }
    if (channelsSent.includes(ChannelType.PUSH)) {
      this.logger.warn('[MOCK] Sending PUSH notification');
      promises.push();
    }
    if (channelsSent.includes(ChannelType.SMS)) {
      this.logger.warn('[MOCK] Sending SMS notification');
      promises.push();
    }

    await Promise.all(promises);
  }

  public async notify(params: NotifyParams): Promise<void> {
    const { userId, type, kind, severity, payload } = params;

    // Fetch user notification preferences
    const userPreferences: GetNotificationPreferencesDto =
      await this.getUserPreferences(userId);

    // Get channels to send based on user preferences
    const channelsToSend = userPreferences.preferences[type];

    // Check if the notification is mandatory
    if (this.isMandatoryNotification(type, kind)) {
      this.logger.log(
        `Notification of type ${type} and kind ${kind} is mandatory. Proceeding to send notification to user ${userId}.`,
      );

      // Ensure at least EMAIL channel is included for mandatory notifications
      if (!channelsToSend.includes(ChannelType.EMAIL)) {
        channelsToSend.push(ChannelType.EMAIL);
      }
    } else if (channelsToSend.length === 0) {
      // User has no preferences set for this notification type, skip sending
      this.logger.warn(
        `User ${userId} has no preferences for notification type ${type}, skipping notification.`,
      );
      return;
    }

    // Build the notification DTO
    const dto: PostNotificationDto = {
      type,
      kind,
      severity,
      payload,
      userId,
      channelsSent: channelsToSend,
    };

    // Process the notification
    await this.processNotification(dto);
  }

  /*
   * Determine if a notification is mandatory based on its type and kind
   */
  private isMandatoryNotification(
    type: NotificationType,
    kind: NotificationKind,
  ): boolean {
    if (type === NotificationType.SECURITY) {
      return true;
    }
    if (
      type === NotificationType.SYSTEM &&
      kind === NotificationKind.USER_BANNED
    ) {
      return true;
    }
    return false;
  }

  /*
   * Save notification to the database
   */
  private async saveNotificationToDb(
    data: PostNotificationDto,
  ): Promise<GetNotificationDto> {
    const notification = await this.prismaService.notification.create({
      data: {
        userId: data.userId,
        severity: data.severity,
        kind: data.kind,
        type: data.type,
        payload: data.payload as any,
        channelsSent: data.channelsSent,
      },
    });
    this.logger.log(
      `Saved notification ${notification.id} for user ${data.userId}`,
    );
    const notificationDto: GetNotificationDto = {
      id: notification.id,
      userId: notification.userId,
      kind: notification.kind as NotificationKind,
      type: notification.type,
      severity: notification.severity,
      payload: notification.payload as unknown as NotificationPayload,
      channelsSent: notification.channelsSent,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
      isRead: notification.isRead,
    };
    return notificationDto;
  }

  /*
   * Send in-app notification via realtime service
   */
  private async sendInApp(dto: GetNotificationDto) {
    this.logger.log(
      `Sending in-app notification to user ${dto.userId} for notification kind ${dto.kind}`,
    );
    await this.realtimeService.broadcastEvent(dto.userId, 'notification', {
      id: dto.id,
      severity: dto.severity,
      kind: dto.kind,
      type: dto.type,
      payload: dto.payload,
      isRead: dto.isRead,
      createdAt: dto.createdAt,
    });
  }

  private readonly DEFAULT_PREFERENCES: Record<
    NotificationType,
    ChannelType[]
  > = {
    [NotificationType.SECURITY]: [ChannelType.PUSH, ChannelType.EMAIL],
    [NotificationType.BILLING]: [
      ChannelType.PUSH,
      ChannelType.IN_APP,
      ChannelType.EMAIL,
    ],
    [NotificationType.SYSTEM]: [ChannelType.IN_APP, ChannelType.EMAIL],
    [NotificationType.SUPPORT]: [ChannelType.IN_APP, ChannelType.EMAIL],
    [NotificationType.SOCIAL]: [ChannelType.IN_APP],
    [NotificationType.MARKETING]: [ChannelType.PUSH, ChannelType.EMAIL],
  };

  /*
   * Get user notification preferences
   */
  public async getUserPreferences(
    userId: UUID,
  ): Promise<GetNotificationPreferencesDto> {
    this.logger.log(`Fetching notification preferences for user ${userId}`);
    const rows = await this.prismaService.notificationPreference.findMany({
      where: { userId },
    });
    const preferencesMap: Record<NotificationType, ChannelType[]> = {} as any;

    rows.forEach((row) => {
      preferencesMap[row.type] = row.channels;
    });

    const preferences: GetNotificationPreferencesDto = {
      preferences: Object.entries(preferencesMap).map(([type, channels]) => ({
        type: type as NotificationType,
        channels,
      })),
    };

    return preferences;
  }

  /*
   * Set default notification preferences for a new user
   */
  public async setDefaultPreferences(
    userId: string,
  ): Promise<GetNotificationPreferencesDto> {
    this.logger.log(
      `Creating default notification preferences for user ${userId}`,
    );
    const defaultPreferences = Object.values(NotificationType).map((type) => {
      return this.prismaService.notificationPreference.upsert({
        where: {
          userId_type: {
            userId,
            type: type as NotificationType,
          },
        },
        create: {
          userId,
          type: type as NotificationType,
          channels: this.DEFAULT_PREFERENCES[type as NotificationType],
        },
        update: {
          channels: this.DEFAULT_PREFERENCES[type],
        },
      });
    });

    await Promise.all(defaultPreferences);

    return this.getUserPreferences(userId);
  }

  /*
   * Update user notification preferences
   */
  public async updateUserPreferences(
    userId: UUID,
    preferences: UpdateNotificationPreferencesDto,
  ): Promise<GetNotificationPreferencesDto> {
    this.logger.log(`Updating notification preferences for user ${userId}`);
    const updates = Object.entries(preferences).map(([type, channels]) => {
      return this.prismaService.notificationPreference.upsert({
        where: {
          userId_type: {
            userId,
            type: type as NotificationType,
          },
        },
        create: {
          userId,
          type: type as NotificationType,
          channels,
        },
        update: {
          channels,
        },
      });
    });

    await Promise.all(updates);

    return this.getUserPreferences(userId);
  }

  /*
   * Get all notifications for the user
   */
  public async getAllNotifications(
    userId: UUID,
    paginationQueryDto?: PaginationQueryDto,
  ): Promise<PaginatedResult<GetNotificationDto>> {
    this.logger.log(`Fetching all notifications for user ${userId}`);

    // Calculate pagination parameters
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = paginationQueryDto;
    const skip = (page - 1) * limit;

    // Fetch notifications from the database
    const [notifications, total] = await Promise.all([
      this.prismaService.notification.findMany({
        where: { userId },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prismaService.notification.count({
        where: { userId },
      }),
    ]);
    const totalPages = Math.ceil(total / limit);

    return {
      data: notifications.map((notification) => ({
        id: notification.id,
        userId: notification.userId,
        kind: notification.kind as NotificationKind,
        type: notification.type,
        severity: notification.severity,
        payload: notification.payload as unknown as NotificationPayload,
        channelsSent: notification.channelsSent,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
        isRead: notification.isRead,
      })),
      meta: {
        totalItems: total,
        totalPages,
        currentPage: page,
        pageSize: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /*
   * Get unread notifications for the user
   */
  public async getUnreadNotifications(
    userId: UUID,
    paginationQueryDto?: PaginationQueryDto,
  ): Promise<PaginatedResult<GetNotificationDto>> {
    this.logger.log(`Fetching unread notifications for user ${userId}`);
    // Calculate pagination parameters
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = paginationQueryDto;
    const skip = (page - 1) * limit;

    // Fetch unread notifications from the database
    const [notifications, total] = await Promise.all([
      this.prismaService.notification.findMany({
        where: { userId, isRead: false },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prismaService.notification.count({
        where: { userId, isRead: false },
      }),
    ]);
    const totalPages = Math.ceil(total / limit);

    return {
      data: notifications.map((notification) => ({
        id: notification.id,
        userId: notification.userId,
        kind: notification.kind as NotificationKind,
        type: notification.type,
        severity: notification.severity,
        payload: notification.payload as unknown as NotificationPayload,
        channelsSent: notification.channelsSent,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
        isRead: notification.isRead,
      })),
      meta: {
        totalItems: total,
        totalPages,
        currentPage: page,
        pageSize: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /*
   * Get count of unread notifications for the user
   */
  public async getUnreadNotificationCount(userId: UUID): Promise<number> {
    this.logger.log(`Counting unread notifications for user ${userId}`);
    return this.prismaService.notification.count({
      where: { userId, isRead: false },
    });
  }

  /*
   * Mark a specific notification as read
   */
  public async markAsRead(userId: UUID, id: UUID): Promise<GetNotificationDto> {
    this.logger.log(`Marking notification ${id} as read for user ${userId}`);
    // Update the notification to mark it as read
    const notification = await this.prismaService.notification.findFirst({
      where: { id: id, userId: userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    await this.prismaService.notification.update({
      where: { id: notification.id },
      data: { isRead: true },
    });

    // Map to GetNotificationDto and return
    return {
      id: notification.id,
      userId: notification.userId,
      kind: notification.kind as NotificationKind,
      type: notification.type,
      severity: notification.severity,
      payload: notification.payload as unknown as NotificationPayload,
      channelsSent: notification.channelsSent,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
      isRead: notification.isRead,
    };
  }

  /*
   * Mark all notifications as read for the user
   */
  public async markAllAsRead(userId: UUID): Promise<void> {
    this.logger.log(`Marking all notifications as read for user ${userId}`);
    // Update all notifications to mark them as read
    await this.prismaService.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  /*
   * Get a specific notification by ID for the user
   */
  public async getNotificationById(
    userId: UUID,
    id: UUID,
  ): Promise<GetNotificationDto> {
    this.logger.log(`Fetching notification ${id} for user ${userId}`);
    const notification = await this.prismaService.notification.findUnique({
      where: { id, userId },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return {
      id: notification.id,
      userId: notification.userId,
      kind: notification.kind as NotificationKind,
      type: notification.type,
      severity: notification.severity,
      payload: notification.payload as unknown as NotificationPayload,
      channelsSent: notification.channelsSent,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
      isRead: notification.isRead,
    };
  }
}
