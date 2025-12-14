import { ApiProperty } from '@nestjs/swagger';
import { ApiResponseDto } from './api-response.dto';

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
