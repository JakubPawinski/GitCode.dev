import { IsDate, IsString } from 'class-validator';
import { UserBaseEvent } from './user-base.event.ts';

export class UserBannedEvent extends UserBaseEvent {
  @IsDate()
  bannedAt: Date;

  @IsString()
  reason?: string;
  constructor(userId: string, reason?: string) {
    super(userId);
    this.bannedAt = new Date();
    this.reason = reason;
  }
}
