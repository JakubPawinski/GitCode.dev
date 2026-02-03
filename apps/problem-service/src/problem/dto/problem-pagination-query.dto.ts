import { IsIn, IsString } from 'class-validator';
import { PaginationQueryDto } from '@gitcode/common';
import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';

export class ProblemPaginationQueryDto extends PartialType(PaginationQueryDto) {
  @IsIn(['easy', 'medium', 'hard'])
  @ApiProperty({
    example: 'easy',
    enum: ['easy', 'medium', 'hard'],
    required: false,
  })
  difficulty?: 'easy' | 'medium' | 'hard';

  @ApiProperty({ example: 'algorithms', required: false })
  topic?: string;

  @ApiProperty({ example: 'Two Sum', required: false })
  @IsString()
  search?: string;
}
