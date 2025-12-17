import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeService } from '../../realtime/realtime.service';
import { ChannelType, NotificationType } from '@prisma/client-notification';
import { UUID } from '@gitcode/types';
import {
  GetNotificationPreferencesDto,
  UpdateNotificationPreferencesDto,
} from '../dtos';
import { PostNotificationDto, GetNotificationDto } from '../dtos/index';
import { NotificationKind } from '../enums';
import type { NotificationPayload } from '../types/index';

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
    const activeChannels = savedNotification.channelsSent;

    if (activeChannels.includes(ChannelType.IN_APP)) {
      promises.push(this.sendInApp(savedNotification));
    }
    if (activeChannels.includes(ChannelType.EMAIL)) {
      promises.push();
    }
    if (activeChannels.includes(ChannelType.PUSH)) {
      promises.push();
    }
    if (activeChannels.includes(ChannelType.SMS)) {
      promises.push();
    }

    await Promise.all(promises);
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
    [NotificationType.SOCIAL]: [ChannelType.IN_APP],
    [NotificationType.PROBLEM]: [ChannelType.IN_APP],
    [NotificationType.SYSTEM]: [ChannelType.IN_APP, ChannelType.EMAIL],
    [NotificationType.MARKETING]: [ChannelType.PUSH, ChannelType.IN_APP],
    [NotificationType.SECURITY]: [ChannelType.PUSH, ChannelType.EMAIL],
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

    Object.values(NotificationType).forEach((type) => {
      if (!preferencesMap[type]) {
        preferencesMap[type] = this.DEFAULT_PREFERENCES[type];
      }
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
}
