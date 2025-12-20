import { Controller, Logger } from '@nestjs/common';
import {
  NOTIFICATION_PATTERNS,
  AUTH_PATTERNS,
  SOCIAL_PATTERNS,
} from '@gitcode/contracts';
import { NotificationService } from './providers/notification.service';
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
  FriendshipAcceptedEnvelope,
  FriendshipDeclinedEnvelope,
  FriendshiprRequestedEnvelope,
  SendNotificationCommandEnvelope,
  UserBannedEnvelope,
  UserCreatedEnvelope,
  UserProfileUpdatedEnvelope,
  UserSoftDeletedEnvelope,
} from './events/envelopes';
import { NotifyParams } from './interfaces';
import { RABBIT_CONFIG } from '../app/config/rabbitmq.config';

@Controller()
export class NotificationConsumer {
  private readonly logger = new Logger(NotificationConsumer.name);
  constructor(private readonly notificationService: NotificationService) {}

  /*
   * Handle create notification events
   */
  @RabbitSubscribe({
    exchange: RABBIT_CONFIG.EXCHANGE,
    routingKey: NOTIFICATION_PATTERNS.SEND_NOTIFICATION_CMD,
    queue: RABBIT_CONFIG.QUEUE,
    errorBehavior: MessageHandlerErrorBehavior.NACK,
  })
  public async handleCreateNotification(
    @RabbitPayload() cmd: SendNotificationCommandEnvelope,
  ) {
    // Map the command payload to NotifyParams
    const payload = {
      userId: cmd.payload.userId,
      type: cmd.payload.type as NotificationType,
      kind: cmd.payload.kind as NotificationKind,
      severity: cmd.payload.severity as NotificationSeverity,
      payload: cmd.payload.payload as NotificationPayload,
    };
    await this.notificationService.notify(payload);
  }

  /*
   * Handle user created events to set default notification preferences
   */
  @RabbitSubscribe({
    exchange: RABBIT_CONFIG.EXCHANGE,
    routingKey: AUTH_PATTERNS.USER_CREATED,
    queue: RABBIT_CONFIG.QUEUE,
    errorBehavior: MessageHandlerErrorBehavior.NACK,
  })
  public async handleUserCreated(
    @RabbitPayload() event: UserCreatedEnvelope,
  ): Promise<void> {
    try {
      // Set default notification preferences for the new user
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

  /*
   * Handle user banned events
   */
  @RabbitSubscribe({
    exchange: RABBIT_CONFIG.EXCHANGE,
    routingKey: AUTH_PATTERNS.USER_BANNED,
    queue: RABBIT_CONFIG.QUEUE,
    errorBehavior: MessageHandlerErrorBehavior.NACK,
  })
  public async handleUserBanned(
    @RabbitPayload() event: UserBannedEnvelope,
  ): Promise<void> {
    // Create notification payload for user banned event
    const payload: NotifyParams = {
      userId: event.payload.userId,
      type: NotificationType.SYSTEM,
      kind: NotificationKind.USER_BANNED,
      severity: NotificationSeverity.ERROR,
      payload: {
        title: 'Account Banned',
        message: `Your account has been banned for the following reason: ${event.payload.reason}`,
        reason: event.payload.reason,
        bannedAt: event.payload.bannedAt.toISOString(),
      },
    };
    await this.notificationService.notify(payload);
  }

  /*
   * Handle user profile updated events
   */
  @RabbitSubscribe({
    exchange: RABBIT_CONFIG.EXCHANGE,
    routingKey: AUTH_PATTERNS.USER_PROFILE_UPDATED,
    queue: RABBIT_CONFIG.QUEUE,
    errorBehavior: MessageHandlerErrorBehavior.NACK,
  })
  public async handleUserProfileUpdated(
    @RabbitPayload() event: UserProfileUpdatedEnvelope,
  ): Promise<void> {
    // Create notification payload for user profile updated event
    const payload: NotifyParams = {
      userId: event.payload.userId,
      type: NotificationType.SYSTEM,
      kind: NotificationKind.USER_PROFILE_UPDATED,
      severity: NotificationSeverity.INFO,
      payload: {
        title: 'Profile Updated',
        message: 'Your user profile has been successfully updated.',
      },
    };
    await this.notificationService.notify(payload);
  }

  /*
   * Handle user soft deleted events
   */
  @RabbitSubscribe({
    exchange: RABBIT_CONFIG.EXCHANGE,
    routingKey: AUTH_PATTERNS.USER_SOFT_DELETED,
    queue: RABBIT_CONFIG.QUEUE,
    errorBehavior: MessageHandlerErrorBehavior.NACK,
  })
  public async handleSoftDeleted(
    @RabbitPayload() event: UserSoftDeletedEnvelope,
  ): Promise<void> {
    // Create notification payload for user soft deleted event
    const payload: NotifyParams = {
      userId: event.payload.userId,
      type: NotificationType.SYSTEM,
      kind: NotificationKind.USER_SOFT_DELETED,
      severity: NotificationSeverity.WARNING,
      payload: {
        title: 'Account Soft Deleted',
        message: 'Your account has been soft deleted.',
      },
    };
    await this.notificationService.notify(payload);
  }

  /*
   * Handle friendship accepted events
   */
  @RabbitSubscribe({
    exchange: RABBIT_CONFIG.EXCHANGE,
    routingKey: SOCIAL_PATTERNS.FRIENDSHIP_ACCEPTED,
    queue: RABBIT_CONFIG.QUEUE,
    errorBehavior: MessageHandlerErrorBehavior.NACK,
  })
  public async handleFriendshipAccepted(
    @RabbitPayload() event: FriendshipAcceptedEnvelope,
  ): Promise<void> {
    // Promise array to hold notification promises
    const promises = [];

    // Notify the addressee that their friend request was accepted
    const addresseePayload: NotifyParams = {
      userId: event.payload.addresseeId,
      type: NotificationType.SOCIAL,
      kind: NotificationKind.FRIEND_INVITE,
      severity: NotificationSeverity.INFO,
      payload: {
        title: 'Friend Request Accepted',
        message: `Your friend request to ${event.payload.requesterUsername} has been accepted.`,
        requesterId: event.payload.requesterId,
        requestId: event.payload.requestId,
      },
    };
    promises.push(this.notificationService.notify(addresseePayload));

    // Notify the requester that their friend request was accepted
    const requesterPayload: NotifyParams = {
      userId: event.payload.requesterId,
      type: NotificationType.SOCIAL,
      kind: NotificationKind.FRIEND_INVITE,
      severity: NotificationSeverity.INFO,
      payload: {
        title: 'Friend Request Accepted',
        message: `${event.payload.addresseeUsername} has accepted your friend request.`,
        addresseeId: event.payload.addresseeId,
        addresseeUsername: event.payload.addresseeUsername,
      },
    };

    promises.push(this.notificationService.notify(requesterPayload));

    // Await all notification promises
    await Promise.all(promises);
  }

  /*
   * Handle friendship declined events
   */
  @RabbitSubscribe({
    exchange: RABBIT_CONFIG.EXCHANGE,
    routingKey: SOCIAL_PATTERNS.FRIENDSHIP_DECLINED,
    queue: RABBIT_CONFIG.QUEUE,
    errorBehavior: MessageHandlerErrorBehavior.NACK,
  })
  public async handleFriendshipDeclined(
    @RabbitPayload() event: FriendshipDeclinedEnvelope,
  ): Promise<void> {
    // Promise array to hold notification promises
    const promises = [];

    // Notify the addressee that their friend request was declined
    const addresseePayload: NotifyParams = {
      userId: event.payload.addresseeId,
      type: NotificationType.SOCIAL,
      kind: NotificationKind.FRIEND_INVITE,
      severity: NotificationSeverity.INFO,
      payload: {
        title: 'Friend Request Declined',
        message: `Your friend request to ${event.payload.requesterUsername} has been declined.`,
        requesterId: event.payload.requesterId,
        requestId: event.payload.requestId,
      },
    };
    promises.push(this.notificationService.notify(addresseePayload));

    // Notify the requester that their friend request was declined
    const requesterPayload: NotifyParams = {
      userId: event.payload.requesterId,
      type: NotificationType.SOCIAL,
      kind: NotificationKind.FRIEND_INVITE,
      severity: NotificationSeverity.INFO,
      payload: {
        title: 'Friend Request Declined',
        message: `${event.payload.addresseeUsername} has declined your friend request.`,
        addresseeId: event.payload.addresseeId,
        addresseeUsername: event.payload.addresseeUsername,
      },
    };

    promises.push(this.notificationService.notify(requesterPayload));

    // Await all notification promises
    await Promise.all(promises);
  }

  /*
   * Handle friendship requested events
   */
  @RabbitSubscribe({
    exchange: RABBIT_CONFIG.EXCHANGE,
    routingKey: SOCIAL_PATTERNS.FRIENDSHIP_REQUESTED,
    queue: RABBIT_CONFIG.QUEUE,
    errorBehavior: MessageHandlerErrorBehavior.NACK,
  })
  public async handleFriendshipRequested(
    @RabbitPayload() event: FriendshiprRequestedEnvelope,
  ): Promise<void> {
    // Promise array to hold notification promises
    const promises = [];

    // Notify the addressee of the new friend request
    const addresseePayload: NotifyParams = {
      userId: event.payload.addresseeId,
      type: NotificationType.SOCIAL,
      kind: NotificationKind.FRIEND_INVITE,
      severity: NotificationSeverity.INFO,
      payload: {
        title: 'New Friend Request',
        message: `You have received a new friend request from ${event.payload.requesterUsername}.`,
        requesterId: event.payload.requesterId,
        requesterUsername: event.payload.requesterUsername,
        requestId: event.payload.requestId,
      },
    };
    promises.push(this.notificationService.notify(addresseePayload));

    // Notify the requester that the friend request has been sent
    const requesterPayload: NotifyParams = {
      userId: event.payload.requesterId,
      type: NotificationType.SOCIAL,
      kind: NotificationKind.FRIEND_INVITE,
      severity: NotificationSeverity.INFO,
      payload: {
        title: 'Friend Request Sent',
        message: `Your friend request to ${event.payload.addresseeUsername} has been sent.`,
        addresseeId: event.payload.addresseeId,
        addresseeUsername: event.payload.addresseeUsername,
        requestId: event.payload.requestId,
      },
    };

    promises.push(this.notificationService.notify(requesterPayload));

    // Await all notification promises
    await Promise.all(promises);
  }
}
