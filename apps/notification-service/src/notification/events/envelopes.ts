import { WithEventPayload } from '@gitcode/messaging';
import { UserCreatedEvent } from '@gitcode/contracts';
import { SendNotificationCommand } from '@gitcode/contracts';

// Envelope for UserCreatedEvent
export class UserCreatedEnvelope extends WithEventPayload(UserCreatedEvent) {}

// Envelope for SendNotificationCommand
export class SendNotificationCommandEnvelope extends WithEventPayload(
  SendNotificationCommand,
) {}
