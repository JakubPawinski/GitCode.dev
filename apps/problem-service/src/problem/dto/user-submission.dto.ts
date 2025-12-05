import { ApiProperty } from '@nestjs/swagger';

export class AttemptDto {
  @ApiProperty({
    description: 'Attempt ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    type: String,
  })
  id: string;

  @ApiProperty({
    description: 'Submission status',
    enum: ['success', 'failed', 'pending'],
    example: 'success',
  })
  status: string;

  @ApiProperty({
    description: 'Code submitted in this attempt',
    example: 'def twoSum(nums, target):\n    pass',
    type: String,
  })
  code: string;

  @ApiProperty({
    description: 'Programming language used',
    example: 'python',
    type: String,
  })
  language: string;

  @ApiProperty({
    description: 'Execution time in milliseconds',
    example: 125.5,
    type: Number,
    nullable: true,
  })
  executionTime: number | null;

  @ApiProperty({
    description: 'Memory used in megabytes',
    example: 42.3,
    type: Number,
    nullable: true,
  })
  memoryUsed: number | null;

  @ApiProperty({
    description: 'Timestamp of this attempt',
    example: '2025-11-25T10:30:00Z',
    type: Date,
  })
  submittedAt: Date;
}

export class UserSubmissionDto {
  @ApiProperty({
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  userId: string;

  @ApiProperty({
    description: 'Problem slug',
    example: 'two-sum',
    type: String,
  })
  problemSlug: string;

  @ApiProperty({
    description: 'Total number of attempts',
    example: 5,
    type: Number,
  })
  totalAttempts: number;

  @ApiProperty({
    description: 'Current submission status',
    enum: ['success', 'failed', 'pending'],
    example: 'success',
  })
  status: string;

  @ApiProperty({
    description: 'Current programming language',
    example: 'python',
    type: String,
  })
  currentLanguage: string;

  @ApiProperty({
    description: 'All attempts made on this problem',
    type: [AttemptDto],
    isArray: true,
  })
  attempts: AttemptDto[];

  @ApiProperty({
    description: 'Best attempt with lowest execution time',
    type: AttemptDto,
    nullable: true,
  })
  bestAttempt: AttemptDto | null;

  @ApiProperty({
    description: 'Timestamp of last submission',
    example: '2025-11-25T10:30:00Z',
    type: Date,
    nullable: true,
  })
  lastSubmittedAt: Date | null;
}
