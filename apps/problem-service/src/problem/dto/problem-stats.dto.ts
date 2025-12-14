import { ApiProperty } from '@nestjs/swagger';

export class ProblemStatsResponseDto {
  @ApiProperty({
    description: 'Total number of submissions for this problem',
    example: 1250,
    type: Number,
  })
  totalSubmissions: number;

  @ApiProperty({
    description: 'Number of accepted/successful submissions',
    example: 845,
    type: Number,
  })
  acceptedSubmissions: number;

  @ApiProperty({
    description: 'Acceptance rate as percentage (0-100)',
    example: 67.6,
    type: Number,
  })
  acceptanceRate: number;

  @ApiProperty({
    description: 'Average execution time in milliseconds',
    example: 125.5,
    type: Number,
    nullable: true,
  })
  avgExecutionTime: number | null;

  @ApiProperty({
    description: 'Average memory used in megabytes',
    example: 42.3,
    type: Number,
    nullable: true,
  })
  avgMemoryUsed: number | null;

  @ApiProperty({
    description: 'Last update timestamp of statistics',
    example: '2025-11-25T10:30:00Z',
    type: Date,
  })
  updatedAt: Date;
}
