import { ApiProperty } from '@nestjs/swagger';
import { ProblemResponseDto } from './problem.dto';

export class RecommendedResponseDto {
  @ApiProperty({
    description: 'User ID for which recommendations are generated',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  userId: string;

  @ApiProperty({
    description: 'Total number of recommended problems',
    example: 5,
    type: Number,
  })
  recommendedCount: number;

  @ApiProperty({
    description: 'List of recommended problems based on user solved topics',
    type: [ProblemResponseDto],
    isArray: true,
  })
  recommendations: ProblemResponseDto[];
}
