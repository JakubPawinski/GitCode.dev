import {
  ProblemSolvedPayload,
  FriendInvitePayload,
  GenericNotificationPayload,
  UserBannedPayload,
  SubmissionAnalyzedPayload,
} from '../dtos/payloads/index';

export type NotificationPayload =
  | ProblemSolvedPayload
  | FriendInvitePayload
  | GenericNotificationPayload
  | UserBannedPayload
  | SubmissionAnalyzedPayload;
