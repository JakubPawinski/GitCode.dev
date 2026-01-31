import { IsUUID } from 'class-validator';
import { GenericNotificationPayload } from './generic.payload';

export class SubmissionAnalyzedPayload extends GenericNotificationPayload {
  @IsUUID()
  attemptId: string;
}
