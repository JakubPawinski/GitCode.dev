import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, IsUUID } from 'class-validator';

export class GetFriendDto {
  @IsUUID()
  @ApiProperty({
    description: 'Unique identifier of the friend',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @IsString()
  @ApiProperty({ description: 'Username of the friend', example: 'john_doe' })
  username: string;

  @IsOptional()
  @IsUrl()
  @ApiProperty({
    description: 'Avatar URL of the friend',
    example: 'https://example.com/avatar.jpg',
  })
  avatarUrl: string | null;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'First name of the friend', example: 'John' })
  firstName: string | null;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Last name of the friend', example: 'Doe' })
  lastName: string | null;
}
