import { ApiProperty } from '@nestjs/swagger';

export class RecentSubmissionDto {
  @ApiProperty({
    description: 'Attempt ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  attemptId: string;

  @ApiProperty({
    description: 'Problem ID',
    example: 'b2fd53c1-4385-4b69-b381-bbf7b0ed89b8',
  })
  problemId: string;

  @ApiProperty({
    description: 'Problem title',
    example: 'Two Sum',
  })
  problemTitle: string;

  @ApiProperty({
    description: 'Problem slug',
    example: 'two-sum',
  })
  problemSlug: string;

  @ApiProperty({
    description: 'Problem difficulty',
    enum: ['EASY', 'MEDIUM', 'HARD'],
  })
  difficulty: string;

  @ApiProperty({
    description: 'Attempt status',
    enum: ['pending', 'running', 'success', 'failed', 'error'],
  })
  status: string;

  @ApiProperty({
    description: 'Programming language',
    example: 'python',
  })
  language: string;

  @ApiProperty({
    description: 'Execution time in ms',
    example: 125.5,
    nullable: true,
  })
  executionTime: number | null;

  @ApiProperty({
    description: 'Memory used in MB',
    example: 42.3,
    nullable: true,
  })
  memoryUsed: number | null;

  @ApiProperty({
    description: 'Number of passed tests',
    example: 8,
  })
  passedTests: number;

  @ApiProperty({
    description: 'Total number of tests',
    example: 10,
  })
  totalTests: number;

  @ApiProperty({
    description: 'Submission timestamp',
    example: '2025-11-25T10:30:00Z',
  })
  createdAt: Date;
}
