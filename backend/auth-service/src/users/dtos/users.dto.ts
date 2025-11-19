import { IsString, IsUrl, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';

export class UsersDto {
  @IsUrl()
  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: 'URL of the user avatar',
  })
  avatarUrl: string;

  @IsString()
  @ApiProperty({ example: 'This is a user bio', description: 'User biography' })
  bio: string;
}

export class PatchUsersDto extends PartialType(UsersDto) {}
