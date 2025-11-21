import { IsBoolean, IsEnum, IsString } from 'class-validator';
import { themeEnum } from '../enums/theme.enum';
import { privacyLevelEnum } from '../enums/privacyLevel.enum';
import { ApiProperty } from '@nestjs/swagger';

export class GetPreferencesDto {
  @ApiProperty({
    enum: themeEnum,
    description: 'User interface theme preference',
  })
  @IsEnum(themeEnum)
  theme: themeEnum;

  @ApiProperty({ description: 'Preferred language' })
  @IsString()
  language: string;

  @ApiProperty({ description: 'Enable or disable notifications' })
  @IsBoolean()
  notifications: boolean;

  @ApiProperty({
    enum: privacyLevelEnum,
    description: 'Privacy level preference',
  })
  @IsEnum(privacyLevelEnum)
  privacyLevel: privacyLevelEnum;
}
