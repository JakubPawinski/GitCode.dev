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
    attemptId: string,
    problemDescription: string,
  ) {
    super(userId, submissionId, code, language, problemId, attemptId);
    this.problemDescription = problemDescription;
  }
}
