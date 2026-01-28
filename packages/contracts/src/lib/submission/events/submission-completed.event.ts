import { IsNotEmpty, IsString } from 'class-validator';
import { SubmissionBaseEvent } from './submission-base.event.ts';

export class SubmissionCompletedEvent extends SubmissionBaseEvent {
  @IsNotEmpty()
  @IsString()
  readonly problemDescription: string;

  constructor(
    userId: string,
    submissionId: string,
    code: string,
    language: string,
    problemId: string,
    problemDescription: string,
  ) {
    super(userId, submissionId, code, language, problemId);
    this.problemDescription = problemDescription;
  }
}
