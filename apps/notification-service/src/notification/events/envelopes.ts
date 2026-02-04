import { WithEventPayload } from '@gitcode/messaging';
import {
  UserCreatedEvent,
  SendNotificationCommand,
  UserBannedEvent,
  FriendshipAcceptedEvent,
  FriendshipDeclinedEvent,
  UserProfileUpdatedEvent,
  UserSoftDeletedEvent,
  FriendshipRequestedEvent,
  SubmissionAnalyzedEvent,
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
  UserProfileUpdatedEvent,
) {}

// Envelope for UserSoftDeletedEvent
export class UserSoftDeletedEnvelope extends WithEventPayload(
  UserSoftDeletedEvent,
) {}

// Envelope for FriendshipAcceptedEvent
export class FriendshipAcceptedEnvelope extends WithEventPayload(
  FriendshipAcceptedEvent,
) {}

// Envelope for FrienshipDeclinedEvent
export class FriendshipDeclinedEnvelope extends WithEventPayload(
  FriendshipDeclinedEvent,
) {}

export class FriendshipRequestedEnvelope extends WithEventPayload(
  FriendshipRequestedEvent,
) {}

export class SubmissionAnalyzedEnvelope extends WithEventPayload(
  SubmissionAnalyzedEvent,
) {}

export class SubmissionCompletedEnvelope extends WithEventPayload(
  SubmissionAnalyzedEvent,
) {}

export class SubmissionFailedEnvelope extends WithEventPayload(
  SubmissionAnalyzedEvent,
) {}
