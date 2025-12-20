import { WithEventPayload } from '@gitcode/messaging';
import {
  UserCreatedEvent,
  SendNotificationCommand,
  UserBannedEvent,
  FriendshipAcceptedEvent,
  FriendshipDeclinedEvent,
} from '@gitcode/contracts';

// Envelope for UserCreatedEvent
export class UserCreatedEnvelope extends WithEventPayload(UserCreatedEvent) {}

// Envelope for SendNotificationCommand
export class SendNotificationCommandEnvelope extends WithEventPayload(
  SendNotificationCommand,
) {}

// Envelope for UserBannedEvent
export class UserBannedEnvelope extends WithEventPayload(UserBannedEvent) {}

// Envelope for UserProfileUpdatedEvent
export class UserProfileUpdatedEnvelope extends WithEventPayload(
  UserCreatedEvent,
) {}

// Envelope for UserSoftDeletedEvent
export class UserSoftDeletedEnvelope extends WithEventPayload(
  UserCreatedEvent,
) {}

// Envelope for FriendshipAcceptedEvent
export class FriendshipAcceptedEnvelope extends WithEventPayload(
  FriendshipAcceptedEvent,
) {}

// Envelope for FrienshipDeclinedEvent
export class FriendshipDeclinedEnvelope extends WithEventPayload(
  FriendshipDeclinedEvent,
) {}

export class FriendshiprRequestedEnvelope extends WithEventPayload(
  FriendshipDeclinedEvent,
) {}
