import { IsEmail, IsOptional } from 'class-validator';
import { SearchUsersDto } from './search-users.dto';

export class SearchUsersAdminDto extends SearchUsersDto {
  @IsOptional()
  @IsEmail()
  email?: string;
}
