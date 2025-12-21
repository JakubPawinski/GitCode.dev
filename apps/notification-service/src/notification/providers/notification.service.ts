import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
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
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../../app/config/default-preferences.const';

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);

  // Cache for mandatory notification configuration
  private configCache = new Map<string, boolean>();

  constructor(
    private readonly prismaService: PrismaService,
    private readonly realtimeService: RealtimeService,
  ) {}

  /*
   * Module initialization logic
   */
  async onModuleInit() {
    this.logger.log('NotificationService module initialized');
    await this.refreshConfigCache();
  }

  /*
   * Refresh notification configuration cache
   */
  public async refreshConfigCache() {
    // Load notification configurations from the database
    const configs = await this.prismaService.notificationConfig.findMany();

    // Clear existing cache
    this.configCache.clear();

    // Populate cache with latest configurations from the database
    configs.forEach((config) => {
      const key = `${config.type}:${config.kind}`;
      this.configCache.set(key, config.isMandatory);
    });
    this.logger.log(
      `Loaded ${this.configCache.size} notification configs into cache`,
    );
  }

  // TODO - implement proper health check logic
  public getHealth() {
    return { status: 'ok' };
  }

  /**
   * Process and send notification based on user preferences
   * @param dto Notification data transfer object
   */
  private async processNotification(dto: PostNotificationDto) {
    this.logger.log(`Processing notification for user ${dto.userId}: ${dto}`);

    // Save notification to the database
    const savedNotification = await this.saveNotificationToDb(dto);

    // Send notification via selected channels
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

  /*
   * Notify user with a notification
   */
  public async notify(params: NotifyParams): Promise<void> {
    const { userId, type, kind, severity, payload } = params;

    // Fetch user notification preferences
    const userPreferences: GetNotificationPreferencesDto =
      await this.getUserPreferences(userId);

    // Get channels to send based on user preferences
    const specificPreference = userPreferences.preferences.find(
      (p) => p.type === type,
    );
    const channelsToSend = specificPreference
      ? [...specificPreference.channels]
      : [];

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

  /**
   * Determine if a notification is mandatory based on its type and kind
   * @param type Notification type
   * @param kind Notification kind
   * @returns boolean indicating if the notification is mandatory
   */
  private isMandatoryNotification(
    type: NotificationType,
    kind: NotificationKind,
  ): boolean {
    // First, check specific type and kind
    const specifyKey = `${type}:${kind}`;
    if (this.configCache.has(specifyKey)) {
      return this.configCache.get(specifyKey);
    }

    // Next, check type with wildcard kind
    const generalKey = `${type}:*`;
    if (this.configCache.has(generalKey)) {
      return this.configCache.get(generalKey);
    }

    return false;
  }

  /**
   * Save notification to the database
   * @param data Notification data transfer object
   */
  private async saveNotificationToDb(
    data: PostNotificationDto,
  ): Promise<GetNotificationDto> {
    // Save notification record
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

    // Map to GetNotificationDto
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

  /**
   * Send in-app notification via realtime service
   * @param dto Notification data transfer object
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

  /*
   * Get user notification preferences
   */
  public async getUserPreferences(
    userId: UUID,
  ): Promise<GetNotificationPreferencesDto> {
    this.logger.log(`Fetching notification preferences for user ${userId}`);

    // Fetch preferences from the database
    const rows = await this.prismaService.notificationPreference.findMany({
      where: { userId },
    });
    const preferencesMap: Record<NotificationType, ChannelType[]> = {} as any;

    // Map database rows to preferences map
    rows.forEach((row) => {
      preferencesMap[row.type] = row.channels;
    });

    // Build the final preferences DTO
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
    // Create default preferences in the database
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
          channels: DEFAULT_NOTIFICATION_PREFERENCES[type as NotificationType],
        },
        update: {
          channels: DEFAULT_NOTIFICATION_PREFERENCES[type as NotificationType],
        },
      });
    });

    // Wait for all upserts to complete
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

    // Upsert each preference into the database
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

    // Wait for all upserts to complete
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
    // Count unread notifications from the database
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

    // If notification not found, throw error
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    // Update the notification to mark it as read
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

    // Fetch the notification from the database
    const notification = await this.prismaService.notification.findUnique({
      where: { id, userId },
    });

    // If notification not found, throw error
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
