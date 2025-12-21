import { NotificationType, ChannelType } from '@prisma/client-notification';

export const DEFAULT_NOTIFICATION_PREFERENCES: Record<
  NotificationType,
  ChannelType[]
> = {
  [NotificationType.SECURITY]: [ChannelType.PUSH, ChannelType.EMAIL],
  [NotificationType.BILLING]: [
    ChannelType.PUSH,
    ChannelType.IN_APP,
    ChannelType.EMAIL,
  ],
  [NotificationType.SYSTEM]: [ChannelType.IN_APP, ChannelType.EMAIL],
  [NotificationType.SUPPORT]: [ChannelType.IN_APP, ChannelType.EMAIL],
  [NotificationType.SOCIAL]: [ChannelType.IN_APP],
  [NotificationType.MARKETING]: [ChannelType.PUSH, ChannelType.EMAIL],
};
