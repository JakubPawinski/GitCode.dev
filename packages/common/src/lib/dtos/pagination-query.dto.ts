import { IsOptional, IsPositive, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @ApiProperty({ example: 1, required: false })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @ApiProperty({ example: 10, required: false })
  limit?: number = 10;

  @IsOptional()
  @ApiProperty({ example: 'createdAt', required: false })
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  @ApiProperty({ example: 'desc', enum: ['asc', 'desc'], required: false })
  sortOrder?: 'asc' | 'desc' = 'desc';
}
