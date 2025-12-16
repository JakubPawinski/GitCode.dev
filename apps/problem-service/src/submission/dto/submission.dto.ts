import { ApiProperty } from '@nestjs/swagger';

export class SubmissionResponseDto {
  @ApiProperty({
    description: 'Submission ID',
    example: 'b2fd53c1-4385-4b69-b381-bbf7b0ed89b8',
    type: String,
  })
  id: string;

  @ApiProperty({
    description: 'User ID who submitted',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  userId: string;

  @ApiProperty({
    description: 'Problem ID',
    example: 'b2fd53c1-4385-4b69-b381-bbf7b0ed89b8',
    type: String,
  })
  problemId: string;

  @ApiProperty({
    description: 'Submission status',
    example: true,
  })
  isSolved: boolean;

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
    description: 'Test results summary',
    example: '5/5 passed',
    type: String,
    nullable: true,
  })
  testResults: string | null;

  @ApiProperty({
    description: 'Error message if submission failed',
    example: 'Runtime error: index out of range',
    type: String,
    nullable: true,
  })
  errorMessage: string | null;

  @ApiProperty({
    description: 'Timestamp of submission',
    example: '2025-11-25T10:30:00Z',
    type: Date,
  })
  submittedAt: Date;
}

export class SubmissionHistoryDto extends SubmissionResponseDto {
  @ApiProperty({
    description: 'Problem title',
    example: 'Two Sum',
    type: String,
  })
  problemTitle: string;

  @ApiProperty({
    description: 'Problem slug',
    example: 'two-sum',
    type: String,
  })
  problemSlug: string;

  @ApiProperty({
    description: 'Problem difficulty',
    enum: ['EASY', 'MEDIUM', 'HARD'],
    example: 'EASY',
  })
  problemDifficulty: string;
}

export class SubmissionStatsDto {
  @ApiProperty({
    description: 'Total number of submissions',
    example: 42,
    type: Number,
  })
  totalSubmissions: number;

  @ApiProperty({
    description: 'Number of successful submissions',
    example: 28,
    type: Number,
  })
  successfulSubmissions: number;

  @ApiProperty({
    description: 'Success rate as percentage',
    example: 66.7,
    type: Number,
  })
  successRate: number;

  @ApiProperty({
    description: 'Average execution time across all submissions',
    example: 145.2,
    type: Number,
    nullable: true,
  })
  avgExecutionTime: number | null;

  @ApiProperty({
    description: 'Average memory used across all submissions',
    example: 51.5,
    type: Number,
    nullable: true,
  })
  avgMemoryUsed: number | null;

  @ApiProperty({
    description: 'Total problems attempted',
    example: 15,
    type: Number,
  })
  problemsAttempted: number;

  @ApiProperty({
    description: 'Total problems solved',
    example: 12,
    type: Number,
  })
  problemsSolved: number;
}
