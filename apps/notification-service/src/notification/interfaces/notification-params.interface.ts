import { UUID } from '@gitcode/types';
import {
  NotificationType,
  NotificationSeverity,
} from '@prisma/client-notification';
import { NotificationKind } from '../enums/notification-kind.enum.ts';
import type { NotificationPayload } from '../types/notification-payload.type.ts';

export interface NotifyParams {
  userId: UUID;
  type: NotificationType;
  kind: NotificationKind;
  severity: NotificationSeverity;
  payload: NotificationPayload;
}
