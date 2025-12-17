import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import {
  NOTIFICATION_PATTERNS,
  AUTH_PATTERNS,
  UserCreatedEvent,
} from '@gitcode/contracts';
import { NotificationService } from './providers/notification.service';

@Controller()
export class NotificationConsumer {
  constructor(private readonly notificationService: NotificationService) {}

  /*
   * Handle create notification events
   */
  @EventPattern([NOTIFICATION_PATTERNS.SEND_NOTIFICATION_CMD])
  public async handleCreateNotification(@Payload() data) {
    await this.notificationService.processNotification(data);
  }

  /*
   * Handle user created events to set default notification preferences
   */
  @EventPattern([AUTH_PATTERNS.USER_CREATED])
  public async handleUserCreated(@Payload() event: UserCreatedEvent) {
    await this.notificationService.setDefaultPreferences(event.userId);
  }
}
