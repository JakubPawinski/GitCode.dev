import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsString,
  IsUrl,
  IsUUID,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { AppRole } from '../../auth/enums/roles.enum';
import { AppPermission } from '../../auth/enums/permissions.enum';
import { ApiProperty } from '@nestjs/swagger';

export class GetProfileDto {
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  id: string;

  @IsEmail()
  @ApiProperty({
    description: 'Email address of the user',
    example: 'user@example.com',
  })
  email: string;

  @IsString()
  @ApiProperty({ description: 'Username of the user', example: 'john_doe' })
  username: string;

  @IsString()
  @ApiProperty({
    description: 'First name of the user',
    nullable: true,
    example: 'John',
  })
  @IsOptional()
  firstName: string | null;

  @IsString()
  @ApiProperty({
    description: 'Last name of the user',
    nullable: true,
    example: 'Doe',
  })
  @IsOptional()
  lastName: string | null;

  @IsUrl()
  @ApiProperty({
    description: 'Avatar URL of the user',
    nullable: true,
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  avatarUrl: string | null;

  @IsString()
  @ApiProperty({
    description: 'Bio of the user',
    nullable: true,
    example: 'Software developer and tech enthusiast.',
  })
  @IsOptional()
  bio: string | null;

  @IsBoolean()
  @ApiProperty({ description: "Indicates if the user's email is verified" })
  emailVerified: boolean;

  @IsEnum(AppRole, {
    each: true,
    message: 'Invalid role(s) provided',
  })
  @ApiProperty({
    description: 'Roles assigned to the user',
    isArray: true,
    enum: AppRole,
  })
  roles: AppRole[];
}
