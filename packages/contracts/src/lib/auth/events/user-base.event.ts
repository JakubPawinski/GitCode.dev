import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class UserBaseEvent {
  @IsUUID()
  @IsNotEmpty()
  readonly userId: string;

  @IsString()
  @IsNotEmpty()
  readonly username: string;

  constructor(userId: string, username: string) {
    this.userId = userId;
    this.username = username;
  }
}
