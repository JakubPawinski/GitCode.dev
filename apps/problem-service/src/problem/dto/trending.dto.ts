import { ApiProperty } from '@nestjs/swagger';
import { ProblemResponseDto } from './problem.dto';

export class TrendingProblemDto extends ProblemResponseDto {
  @ApiProperty({
    description: 'Total number of submissions for this problem',
    example: 2150,
    type: Number,
  })
  totalSubmissions: number;

  @ApiProperty({
    description: 'Acceptance rate as percentage (0-100)',
    example: 72.5,
    type: Number,
  })
  acceptanceRate: number;
}

export class TrendingResponseDto {
  @ApiProperty({
    description: 'Total count of trending problems returned',
    example: 10,
    type: Number,
  })
  trendingCount: number;

  @ApiProperty({
    description: 'List of top 10 trending problems sorted by submissions count',
    type: [TrendingProblemDto],
    isArray: true,
  })
  trending: TrendingProblemDto[];
}
