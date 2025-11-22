import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GetProfileDto } from './get-profile.dto';
import { GetPreferencesDto } from './get-preferences.dto';
import { AppPermission } from '../../auth/enums/permissions.enum';
import { UserStatus } from '../../auth/enums/user-status.enum';

export class GetUserDto extends GetProfileDto {
  @ApiProperty({ description: 'Status of the user account', enum: UserStatus })
  @IsEnum(UserStatus)
  userStatus: UserStatus;

  @ApiProperty({ description: 'Account creation date' })
  @IsDateString()
  createdAt: string;

  @ApiProperty({ description: 'Last update date' })
  @IsDateString()
  updatedAt: string;

  @ApiPropertyOptional({ description: 'Last login date', nullable: true })
  @IsOptional()
  @IsDateString()
  lastLogin?: string | null;

  @ApiPropertyOptional({
    description: 'User preferences',
    type: GetPreferencesDto,
    nullable: true,
  })
  @IsOptional()
  @Type(() => GetPreferencesDto)
  preferences?: GetPreferencesDto | null;

  @ApiProperty({
    description: 'Permissions assigned to the user',
    isArray: true,
    enum: AppPermission,
  })
  @IsArray()
  @IsEnum(AppPermission, { each: true })
  permissions: AppPermission[];
}
