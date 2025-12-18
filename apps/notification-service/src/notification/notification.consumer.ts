import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import {
  NOTIFICATION_PATTERNS,
  AUTH_PATTERNS,
  SendNotificationCommand,
} from '@gitcode/contracts';
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
import { UserCreatedEnvelope } from './events/envelopes';

@Controller()
export class NotificationConsumer {
  private readonly logger = new Logger(NotificationConsumer.name);
  constructor(private readonly notificationService: NotificationService) {}

  /*
   * Handle create notification events
   */
  @EventPattern([NOTIFICATION_PATTERNS.SEND_NOTIFICATION_CMD])
  public async handleCreateNotification(
    @Payload() cmd: SendNotificationCommand,
  ) {
    const userPreferences: GetNotificationPreferencesDto =
      await this.notificationService.getUserPreferences(cmd.userId);

    if (!userPreferences.preferences[cmd.type]) {
      this.logger.warn(
        `User ${cmd.userId} has no preferences for notification type ${cmd.type}, skipping notification.`,
      );
      // User has no preferences set for this notification type, skip sending
      return;
    }
    const dto: PostNotificationDto = {
      type: cmd.type as NotificationType,
      kind: cmd.kind as NotificationKind,
      severity: cmd.severity as NotificationSeverity,
      payload: cmd.payload as NotificationPayload,
      userId: cmd.userId,
      channelsSent: userPreferences.preferences[cmd.type],
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
