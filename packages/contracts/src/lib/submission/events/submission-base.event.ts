import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class SubmissionBaseEvent {
  @IsUUID()
  @IsNotEmpty()
  readonly userId: string;

  @IsUUID()
  @IsNotEmpty()
  readonly submissionId: string;

  @IsString()
  @IsNotEmpty()
  readonly code: string;

  @IsString()
  @IsNotEmpty()
  readonly language: string;

  @IsUUID()
  @IsNotEmpty()
  readonly problemId: string;

  constructor(
    userId: string,
    submissionId: string,
    code: string,
    language: string,
    problemId: string,
  ) {
    this.userId = userId;
    this.submissionId = submissionId;
    this.code = code;
    this.language = language;
    this.problemId = problemId;
  }
}
