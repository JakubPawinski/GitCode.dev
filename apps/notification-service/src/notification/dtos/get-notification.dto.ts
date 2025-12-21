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
  @ApiProperty({ description: 'Unique identifier of the notification', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  id: UUID;

  @ApiProperty({ description: 'Unique identifier of the user', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  userId: UUID;

  @ApiProperty({ description: 'Kind of the notification', example: NotificationKind.PROBLEM_SOLVED })
  @IsEnum(NotificationKind)
  kind: NotificationKind;

  @ApiProperty({ description: 'Type of the notification', example: NotificationType.SYSTEM })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'Severity of the notification', example: NotificationSeverity.INFO })
  @IsEnum(NotificationSeverity)
  severity: NotificationSeverity;

  @ApiProperty({ description: 'Payload of the notification', example: { message: 'Your order has been shipped.' } })
  payload: NotificationPayload;

  @ApiProperty({
    description: 'Channels through which the notification was sent', example: [ChannelType.EMAIL, ChannelType.SMS],
  })
  channelsSent: ChannelType[];

  @ApiProperty({ description: 'Timestamp when the notification was created', example: new Date().toISOString() })
  @IsDate()
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the notification was last updated', example: new Date().toISOString(),
  })
  @IsDate()
  updatedAt: Date;

  @ApiProperty({ description: 'Read status of the notification', example: false })
  @IsBoolean()
  isRead: boolean;
}
