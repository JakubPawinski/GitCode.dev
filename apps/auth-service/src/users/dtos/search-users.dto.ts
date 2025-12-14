import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationQueryDto } from '@gitcode/common';

export class SearchUsersDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Filter by username', required: false })
  @MinLength(3)
  username?: string;
}
