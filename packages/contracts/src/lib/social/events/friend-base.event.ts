import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class BaseFriendshipEvent {
  @IsNotEmpty()
  @IsUUID()
  readonly requestId: string;

  @IsString()
  @IsNotEmpty()
  readonly requesterUsername: string;

  @IsUUID()
  @IsNotEmpty()
  readonly requesterId: string;

  @IsString()
  @IsNotEmpty()
  readonly addresseeUsername: string;

  @IsUUID()
  @IsNotEmpty()
  readonly addresseeId: string;

  constructor(
    requestId: string,
    requesterId: string,
    requesterUsername: string,
    addresseeId: string,
    addresseeUsername: string,
  ) {
    this.requestId = requestId;
    this.requesterId = requesterId;
    this.requesterUsername = requesterUsername;
    this.addresseeId = addresseeId;
    this.addresseeUsername = addresseeUsername;
  }
}
