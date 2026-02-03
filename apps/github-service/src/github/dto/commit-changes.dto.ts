import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsUUID,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FileChangeDto {
  @ApiProperty({
    description: 'File path relative to repository root',
    example: 'problems/two-sum/solution.py',
  })
  @IsString()
  @IsNotEmpty()
  path: string;

  @ApiProperty({
    description: 'File content',
    example: 'def two_sum(nums, target):\n    ...',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class CommitChangesDto {
  @ApiProperty({
    description: 'Commit message',
    example: 'Add solution for Two Sum problem',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'Files to commit',
    type: [FileChangeDto],
    example: [
      {
        path: 'problems/two-sum/solution.py',
        content: 'def two_sum(nums, target):\n    ...',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileChangeDto)
  files: FileChangeDto[];

  @ApiProperty({
    description: 'Branch name',
    default: 'main',
    example: 'main',
  })
  @IsString()
  branch?: string;

  @ApiProperty({
    description: 'Submission ID (optional, for problem submissions)',
    required: false,
    example: 'uuid-here',
  })
  @IsOptional()
  @IsUUID()
  submissionId?: string;
}
