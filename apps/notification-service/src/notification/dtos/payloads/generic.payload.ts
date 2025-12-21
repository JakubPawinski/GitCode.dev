import { IsString } from 'class-validator';

export class GenericNotificationPayload {
  @IsString()
  message: string;
  @IsString()
  title: string;
}
