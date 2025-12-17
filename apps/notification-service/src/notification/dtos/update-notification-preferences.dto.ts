import { PartialType } from '@nestjs/swagger';
import { GetNotificationPreferencesDto } from './get-notification-preferences.dto';

export class UpdateNotificationPreferencesDto extends PartialType(
  GetNotificationPreferencesDto,
) {}
