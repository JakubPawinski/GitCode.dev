import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class PatchProfileDto {
  @ApiProperty({
    description: 'Biography of the user',
    example: 'This is a user bio',
  })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({
    description: 'Avatar URL of the user',
    example: 'https://example.com/avatar.jpg',
  })
  @IsUrl()
  @IsOptional()
  avatarUrl?: string;
}
