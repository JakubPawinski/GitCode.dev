import { IsArray, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ChannelType } from '@prisma/client-notification';
import { NotificationType } from '@prisma/client-notification';

export class GetNotificationPreferencesDto {
  @ValidateNested({ each: true })
  @Type(() => PreferenceDto)
  preferences: PreferenceDto[];
}

export class PreferenceDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsArray()
  @IsEnum(ChannelType, { each: true })
  channels: ChannelType[];
}
