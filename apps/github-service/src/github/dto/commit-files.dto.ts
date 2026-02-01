import { IsString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class FileContent {
  @IsString()
  path: string;

  @IsString()
  content: string;
}

export class CommitFilesDto {
  @IsString()
  owner: string;

  @IsString()
  repo: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileContent)
  files: FileContent[];

  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  branch?: string;
}
