import { IsOptional, IsPositive, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ApiResponseDto } from './api-response.dto';

export class PaginationDto {
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

  @IsOptional()
  @IsIn(['easy', 'medium', 'hard'])
  difficulty?: 'easy' | 'medium' | 'hard';

  @IsOptional()
  topic?: string;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  currentPage: number;

  @ApiProperty({ example: 10 })
  pageSize: number;

  @ApiProperty({ example: 100 })
  totalItems: number;

  @ApiProperty({ example: 10 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNextPage: boolean;

  @ApiProperty({ example: false })
  hasPreviousPage: boolean;
}

export class PaginatedResponseDto<T> extends ApiResponseDto<T[]> {
  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
