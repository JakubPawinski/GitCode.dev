import { IsIn, IsOptional } from 'class-validator';
import { PaginationDto } from '@gitcode/common';
import { ApiProperty } from '@nestjs/swagger';

export class ProblemPaginationQueryDto extends PaginationDto {
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
