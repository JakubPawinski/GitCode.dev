import { PaginationQueryDto } from '@gitcode/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class SearchAchievementsDto extends PaginationQueryDto {
  @IsOptional()
  @MinLength(3)
  @IsString()
  @ApiProperty({ description: 'Filter by name', required: false })
  name?: string;

  @MinLength(3)
  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Filter by description', required: false })
  description?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Filter by event type', required: false })
  eventType?: string;
  @IsEnum(['createdAt', 'name'])
  override sortBy?: 'createdAt' | 'name' = 'createdAt';
}
