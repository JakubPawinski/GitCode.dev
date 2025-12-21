import { IsEnum, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { NotificationKind } from '../enums/index';
import {
  ChannelType,
  NotificationSeverity,
  NotificationType,
} from '@prisma/client-notification';
import {
  ProblemSolvedPayload,
  FriendInvitePayload,
  GenericNotificationPayload,
  UserBannedPayload,
} from './payloads/index.ts';
import type { NotificationPayload } from '../types/notification-payload.type.ts';

export class PostNotificationDto {
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Severity level of the notification',
    example: NotificationSeverity.INFO,
  })
  @IsEnum(NotificationSeverity)
  severity: NotificationSeverity;

  @ApiProperty({
    description: 'Kind of the notification',
    example: 'problem_created',
  })
  @IsString()
  @IsEnum(NotificationKind)
  kind: NotificationKind;

  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: 'Polymorphic payload based on kind',
    oneOf: [
      { $ref: '#/components/schemas/GenericNotificationPayload' },
      { $ref: '#/components/schemas/ProblemCreatedPayload' },
    ],
  })
  @ValidateNested()
  @Type(
    (opts) => {
      switch (opts.object.kind) {
        case NotificationKind.PROBLEM_SOLVED:
          return ProblemSolvedPayload;
        case NotificationKind.FRIEND_INVITE:
          return FriendInvitePayload;
        case NotificationKind.USER_BANNED:
          return UserBannedPayload;
        default:
          return GenericNotificationPayload;
      }
    },
    {
      keepDiscriminatorProperty: true,
      discriminator: {
        property: 'kind',
        subTypes: [
          {
            value: ProblemSolvedPayload,
            name: NotificationKind.PROBLEM_SOLVED,
          },
          { value: FriendInvitePayload, name: NotificationKind.FRIEND_INVITE },
          { value: GenericNotificationPayload, name: 'GENERIC' },
        ],
      },
    },
  )
  payload: NotificationPayload;

  @ApiProperty({
    description: 'Channels through which the notification was sent',
    example: [ChannelType.IN_APP, ChannelType.EMAIL],
  })
  @IsEnum(ChannelType)
  channelsSent: ChannelType[];
}
