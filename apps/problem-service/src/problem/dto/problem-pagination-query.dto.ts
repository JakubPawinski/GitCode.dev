import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '@gitcode/common';
import { ApiProperty } from '@nestjs/swagger';

export class ProblemPaginationQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['easy', 'medium', 'hard'])
  @ApiProperty({
    example: 'easy',
    enum: ['easy', 'medium', 'hard'],
    required: false,
  })
  difficulty?: 'easy' | 'medium' | 'hard';

  @IsOptional()
  @ApiProperty({ example: 'algorithms', required: false })
  topic?: string;
}
