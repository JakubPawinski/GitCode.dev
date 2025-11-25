import { ApiProperty } from '@nestjs/swagger';

export class CreateSubmissionDto {
  @ApiProperty({
    description: 'Problem ID to submit solution for',
    example: 'b2fd53c1-4385-4b69-b381-bbf7b0ed89b8',
    type: String,
  })
  problemId: string;

  @ApiProperty({
    description: 'Source code of the solution',
    example: 'def twoSum(nums, target):\n    pass',
    type: String,
  })
  code: string;

  @ApiProperty({
    description: 'Programming language used',
    enum: ['python', 'javascript', 'java', 'cpp', 'golang'],
    example: 'python',
  })
  language: string;
}

export class CreateSubmissionResponseDto {
  @ApiProperty({
    description: 'Attempt ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Submission ID',
    example: 'b2fd53c1-4385-4b69-b381-bbf7b0ed89b8',
  })
  submissionId: string;

  @ApiProperty({
    description: 'Current status',
    enum: ['pending', 'running', 'queued'],
    example: 'queued',
  })
  status: string;

  @ApiProperty({
    description: 'Attempt number',
    example: 1,
  })
  attemptNumber: number;

  @ApiProperty({
    description: 'Queue position',
    example: 2,
  })
  queuePosition: number;

  @ApiProperty({
    description: 'Total items in queue',
    example: 5,
  })
  queueSize: number;

  @ApiProperty({
    description: 'Estimated wait time in ms',
    example: 2500,
  })
  estimatedWaitTime: number;

  @ApiProperty({
    description: 'Timestamp of creation',
    example: '2025-11-25T10:30:00Z',
  })
  createdAt: Date;
}
