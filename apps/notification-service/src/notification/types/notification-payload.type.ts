import {
  ProblemSolvedPayload,
  FriendInvitePayload,
  GenericNotificationPayload,
  UserBannedPayload,
} from '../dtos/payloads/index';

export type NotificationPayload =
  | ProblemSolvedPayload
  | FriendInvitePayload
  | GenericNotificationPayload
  | UserBannedPayload;
