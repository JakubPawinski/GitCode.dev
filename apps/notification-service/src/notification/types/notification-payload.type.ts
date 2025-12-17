import {
  ProblemSolvedPayload,
  FriendInvitePayload,
  GenericNotificationPayload,
} from '../dtos/payloads/index';

export type NotificationPayload =
  | ProblemSolvedPayload
  | FriendInvitePayload
  | GenericNotificationPayload;
