import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { GenericNotificationPayload } from './generic.payload';

export class UserBannedPayload extends GenericNotificationPayload {
  @IsDate()
  @IsNotEmpty()
  bannedAt: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
