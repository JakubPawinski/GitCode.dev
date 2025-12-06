import { ApiProperty } from '@nestjs/swagger';

export class SubmissionDto {
  @ApiProperty({
    description: 'Problem ID',
    example: 'b2fd53c1-4385-4b69-b381-bbf7b0ed89b8',
    type: String,
  })
  problemId: string;

  @ApiProperty({
    description: 'Problem title',
    example: 'Two Sum',
    type: String,
  })
  title: string;

  @ApiProperty({
    description: 'Problem URL slug',
    example: 'two-sum',
    type: String,
  })
  slug: string;

  @ApiProperty({
    description: 'Problem difficulty level',
    enum: ['EASY', 'MEDIUM', 'HARD'],
    example: 'EASY',
  })
  difficulty: string;

  @ApiProperty({
    description: 'Submission status',
    enum: ['success', 'attempted', 'failed'],
    example: 'success',
    type: String,
  })
  status: string | null;

  @ApiProperty({
    description: 'Last attempt timestamp',
    example: '2025-11-25T10:30:00Z',
    type: Date,
  })
  lastAttempt: Date | null;
}

export class UserProgressResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  userId: string;

  @ApiProperty({
    description: 'Total number of problems in the platform',
    example: 150,
    type: Number,
  })
  totalProblems: number;

  @ApiProperty({
    description: 'Number of problems solved by user',
    example: 45,
    type: Number,
  })
  solvedProblems: number;

  @ApiProperty({
    description: 'Number of problems attempted by user',
    example: 62,
    type: Number,
  })
  attemptedProblems: number;

  @ApiProperty({
    description: 'Progress percentage (0-100)',
    example: 30.0,
    type: Number,
  })
  progressPercentage: number;

  @ApiProperty({
    description: 'List of user submissions with details',
    type: [SubmissionDto],
    isArray: true,
  })
  submissions: SubmissionDto[];
}
