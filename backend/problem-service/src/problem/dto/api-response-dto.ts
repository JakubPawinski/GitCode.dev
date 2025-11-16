import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Operation successful' })
  message?: string;

  @ApiProperty()
  data?: T;

  @ApiProperty({ example: null })
  error?: {
    code: string;
    message: string;
    details?: any;
  };

  @ApiProperty({ example: '2025-11-02T14:30:45.123Z' })
  timestamp: string;

  @ApiProperty({ example: '/problem/problem-slug' })
  path?: string;
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
