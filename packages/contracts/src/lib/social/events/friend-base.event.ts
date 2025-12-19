import { IsNotEmpty, IsUUID } from 'class-validator';

export class BaseFriendshipEvent {
  @IsNotEmpty()
  @IsUUID()
  readonly requestId: string;

  @IsUUID()
  @IsNotEmpty()
  readonly requesterId: string;

  @IsUUID()
  @IsNotEmpty()
  readonly addresseeId: string;

  constructor(requestId: string, requesterId: string, addresseeId: string) {
    this.requestId = requestId;
    this.requesterId = requesterId;
    this.addresseeId = addresseeId;
  }
}
