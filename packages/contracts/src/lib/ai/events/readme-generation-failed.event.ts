import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class ReadmeGenerationFailedEvent {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty()
  @IsString()
  reason: string;

  constructor(userId: string, reason: string) {
    this.userId = userId;
    this.reason = reason;
  }
}
