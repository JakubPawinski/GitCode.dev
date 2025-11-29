import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, IsUUID } from 'class-validator';

export class RequesterDto {
  @IsUUID()
  @ApiProperty({
    description: 'Unique identifier of the requester',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  requesterId: string;

  @ApiProperty({
    description: 'Username of the requester',
    example: 'john_doe',
  })
  @IsString()
  username: string;

  @IsOptional()
  @IsUrl()
  @ApiProperty({
    description: 'Avatar URL of the requester',
    example: 'https://example.com/avatar.jpg',
    nullable: true,
  })
  avatarUrl: string | null;

  @ApiProperty({ description: 'First name of the requester', example: 'John' })
  @IsOptional()
  @IsString()
  firstName: string | null;

  @ApiProperty({ description: 'Last name of the requester', example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName: string | null;
}
