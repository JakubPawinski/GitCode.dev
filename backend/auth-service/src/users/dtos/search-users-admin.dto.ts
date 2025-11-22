import { IsEmail, IsOptional, MinLength } from 'class-validator';
import { SearchUsersDto } from './search-users.dto';
import { ApiProperty } from '@nestjs/swagger';

export class SearchUsersAdminDto extends SearchUsersDto {
  @ApiProperty({ description: 'Filter by email address', required: false })
  @IsOptional()
  @IsEmail()
  @MinLength(3)
  email?: string;
}
