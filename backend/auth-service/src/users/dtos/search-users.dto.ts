import { IsOptional, IsString, IsInt, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SearchUsersDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Filter by username', required: false })
  @MinLength(3)
  username?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @ApiProperty({ description: 'Page number for pagination', required: false })
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @ApiProperty({
    description: 'Number of users per page for pagination',
    required: false,
  })
  limit?: number = 10;
}
