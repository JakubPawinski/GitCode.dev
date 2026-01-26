import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class SubmissionAnalyzedEvent {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsNotEmpty()
  submissionId: string;

  @IsUUID()
  @IsNotEmpty()
  problemId: string;

  @IsNotEmpty()
  @IsString()
  analysisReport: string;
}
