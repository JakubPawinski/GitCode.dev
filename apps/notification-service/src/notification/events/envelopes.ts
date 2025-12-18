import { WithEventPayload } from '@gitcode/messaging';
import { UserCreatedEvent } from '@gitcode/contracts';

// Envelope for UserCreatedEvent
export class UserCreatedEnvelope extends WithEventPayload(UserCreatedEvent) {}
