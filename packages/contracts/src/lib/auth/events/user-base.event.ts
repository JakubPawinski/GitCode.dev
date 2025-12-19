import { IsNotEmpty, IsUUID } from 'class-validator';

export class UserBaseEvent {
  @IsUUID()
  @IsNotEmpty()
  readonly userId: string;
  constructor(userId: string) {
    this.userId = userId;
  }
}
