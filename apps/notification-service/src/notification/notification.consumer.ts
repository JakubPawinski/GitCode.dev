import { Controller, Logger } from '@nestjs/common';
import { NOTIFICATION_PATTERNS, AUTH_PATTERNS } from '@gitcode/contracts';
import { NotificationService } from './providers/notification.service';
import { GetNotificationPreferencesDto, PostNotificationDto } from './dtos';
import {
  NotificationSeverity,
  NotificationType,
} from '@prisma/client-notification';
import { NotificationKind } from './enums/index';
import { NotificationPayload } from './types';
import {
  MessageHandlerErrorBehavior,
  RabbitPayload,
  RabbitSubscribe,
} from '@golevelup/nestjs-rabbitmq';
import {
  SendNotificationCommandEnvelope,
  UserCreatedEnvelope,
} from './events/envelopes';

@Controller()
export class NotificationConsumer {
  private readonly logger = new Logger(NotificationConsumer.name);
  constructor(private readonly notificationService: NotificationService) {}

  /*
   * Handle create notification events
   */
  @RabbitSubscribe({
    exchange: 'gitcode_exchange',
    routingKey: NOTIFICATION_PATTERNS.SEND_NOTIFICATION_CMD,
    queue: 'notification_queue',
    errorBehavior: MessageHandlerErrorBehavior.NACK,
  })
  public async handleCreateNotification(
    @RabbitPayload() cmd: SendNotificationCommandEnvelope,
  ) {
    const payload = cmd.payload;
    const userPreferences: GetNotificationPreferencesDto =
      await this.notificationService.getUserPreferences(payload.userId);

    if (!userPreferences.preferences[payload.type]) {
      this.logger.warn(
        `User ${payload.userId} has no preferences for notification type ${payload.type}, skipping notification.`,
      );
      // User has no preferences set for this notification type, skip sending
      return;
    }
    const dto: PostNotificationDto = {
      type: payload.type as NotificationType,
      kind: payload.kind as NotificationKind,
      severity: payload.severity as NotificationSeverity,
      payload: payload.payload as NotificationPayload,
      userId: payload.userId,
      channelsSent: userPreferences.preferences[payload.type],
    };
    await this.notificationService.processNotification(dto);
  }

  /*
   * Handle user created events to set default notification preferences
   */
  @RabbitSubscribe({
    exchange: 'gitcode_exchange',
    routingKey: AUTH_PATTERNS.USER_CREATED,
    queue: 'notification_queue',
    errorBehavior: MessageHandlerErrorBehavior.NACK,
  })
  public async handleUserCreated(
    @RabbitPayload() event: UserCreatedEnvelope,
  ): Promise<void> {
    try {
      await this.notificationService.setDefaultPreferences(
        event.payload.userId,
      );
    } catch (error) {
      this.logger.error(
        `Failed to set default notification preferences for user ${event.payload.userId}`,
        error.message,
      );
    }
  }
}
