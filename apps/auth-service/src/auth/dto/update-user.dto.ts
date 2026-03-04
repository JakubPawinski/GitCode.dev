import { AppPermission, AppRole } from '@gitcode/types';
import type { AppRoles, AppPermissions } from '@gitcode/types';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  username: string;

  @IsOptional()
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  avatarUrl: string;

  @IsOptional()
  @IsBoolean()
  emailVerified: boolean;

  @IsOptional()
  @IsArray()
  @IsEnum(AppRole, { each: true })
  roles: AppRoles;

  @IsArray()
  @IsOptional()
  @IsEnum(AppPermission, { each: true })
  permissions: AppPermissions;
}
