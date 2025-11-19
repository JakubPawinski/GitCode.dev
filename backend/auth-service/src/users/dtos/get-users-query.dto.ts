import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetUsersQueryDto {
  @ApiProperty({ example: 1, description: 'Page number for pagination' })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    example: 10,
    description: 'Number of users per page for pagination',
  })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
