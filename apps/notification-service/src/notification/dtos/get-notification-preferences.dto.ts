import { IsArray, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ChannelType } from '@prisma/client-notification';
import { NotificationType } from '@prisma/client-notification';
import { ApiProperty } from '@nestjs/swagger';

export class PreferenceDto {
  @ApiProperty({
    enum: NotificationType,
    description: 'Type of notification',
    example: NotificationType.SECURITY,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    enum: ChannelType,
    isArray: true,
    description: 'Channels for the notification',
    example: [ChannelType.EMAIL, ChannelType.SMS],
  })
  @IsArray()
  @IsEnum(ChannelType, { each: true })
  channels: ChannelType[];
}
export class GetNotificationPreferencesDto {
  @ApiProperty({
    type: [PreferenceDto],
    description: 'List of notification preferences',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PreferenceDto)
  preferences: PreferenceDto[];
}
