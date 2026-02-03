import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsArray,
  IsUrl,
  IsDateString,
  IsOptional,
} from 'class-validator';

export class FileCommittedEvent {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  commitSha: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsUrl()
  @IsNotEmpty()
  commitUrl: string;

  @IsString()
  @IsNotEmpty()
  repositoryName: string;

  @IsString()
  @IsNotEmpty()
  branch: string;

  @IsArray()
  @IsString({ each: true })
  filePaths: string[];

  @IsDateString()
  committedAt: string;

  @IsOptional()
  @IsUUID()
  submissionId?: string;

  constructor(
    userId: string,
    commitSha: string,
    message: string,
    commitUrl: string,
    repositoryName: string,
    branch: string,
    filePaths: string[],
    committedAt: string,
    submissionId?: string,
  ) {
    this.userId = userId;
    this.commitSha = commitSha;
    this.message = message;
    this.commitUrl = commitUrl;
    this.repositoryName = repositoryName;
    this.branch = branch;
    this.filePaths = filePaths;
    this.committedAt = committedAt;
    this.submissionId = submissionId;
  }
}
