import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class SubmissionBaseEvent {
  @IsUUID()
  @IsNotEmpty()
  readonly userId: string;

  @IsString()
  @IsNotEmpty()
  readonly username: string;

}
