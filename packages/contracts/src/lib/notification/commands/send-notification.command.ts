import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsObject,
} from 'class-validator';

/*
 * Command to send a notification to a user.
 */
export class SendNotificationCommand {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  kind: string;

  @IsString()
  @IsNotEmpty()
  severity: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;

  constructor(
    userId: string,
    type: string,
    kind: string,
    severity: string,
    payload?: Record<string, any>,
  ) {
    this.userId = userId;
    this.type = type;
    this.kind = kind;
    this.severity = severity;
    this.payload = payload;
  }
}
