import { WithEventPayload } from '@gitcode/messaging';
import { UserCreatedEvent, ReadmeGeneratedEvent } from '@gitcode/contracts';

// Envelope for UserCreatedEvent
export class UserCreatedEnvelope extends WithEventPayload(UserCreatedEvent) {}

export class ReadmeGeneratedEnvelope extends WithEventPayload(
  ReadmeGeneratedEvent,
) {}
