import { NotificationKind } from '../enums';
import {
  NotificationType,
  NotificationSeverity,
  ChannelType,
} from '@prisma/client-notification';
import type { UUID } from '@gitcode/types';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsEnum, IsUUID } from 'class-validator';
import type { NotificationPayload } from '../types/notification-payload.type.ts';

export class GetNotificationDto {
  @ApiProperty({ description: 'Unique identifier of the notification' })
  @IsUUID()
  id: UUID;

  @ApiProperty({ description: 'Unique identifier of the user' })
  @IsUUID()
  userId: UUID;

  @ApiProperty({ description: 'Kind of the notification' })
  @IsEnum(NotificationKind)
  kind: NotificationKind;

  @ApiProperty({ description: 'Type of the notification' })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'Severity of the notification' })
  @IsEnum(NotificationSeverity)
  severity: NotificationSeverity;

  @ApiProperty({ description: 'Payload of the notification' })
  payload: NotificationPayload;

  @ApiProperty({
    description: 'Channels through which the notification was sent',
  })
  channelsSent: ChannelType[];

  @ApiProperty({ description: 'Timestamp when the notification was created' })
  @IsDate()
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the notification was last updated',
  })
  @IsDate()
  updatedAt: Date;

  @ApiProperty({ description: 'Read status of the notification' })
  @IsBoolean()
  isRead: boolean;
}
