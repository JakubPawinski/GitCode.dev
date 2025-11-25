import { IsOptional, IsPositive, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ApiResponseDto } from './api-response-dto';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit: number = 10;

  @IsOptional()
  sortBy: string = 'createdAt';

  @IsOptional()
  sortOrder: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsIn(['easy', 'medium', 'hard'])
  difficulty?: 'easy' | 'medium' | 'hard';

  @IsOptional()
  topic?: string;
}
export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 10 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNextPage: boolean;

  @ApiProperty({ example: false })
  hasPreviousPage: boolean;
}
export class PaginatedResponseDto<T> extends ApiResponseDto<T[]> {
  @ApiProperty({ example: PaginationMetaDto })
  pagination: PaginationMetaDto;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
