import { IsBoolean, IsEnum, IsString } from 'class-validator';
import { themeEnum } from '../enums/theme.enum';
import { privacyLevelEnum } from '../enums/privacyLevel.enum';
import { ApiProperty } from '@nestjs/swagger';

export class GetPreferencesDto {
  @ApiProperty({
    enum: themeEnum,
    description: 'User interface theme preference',
    example: themeEnum.DARK,
  })
  @IsEnum(themeEnum)
  theme: themeEnum;

  @ApiProperty({ description: 'Preferred language', example: 'en' })
  @IsString()
  language: string;

  @ApiProperty({
    description: 'Enable or disable notifications',
    example: true,
  })
  @IsBoolean()
  notifications: boolean;

  @ApiProperty({
    enum: privacyLevelEnum,
    description: 'Privacy level preference',
    example: privacyLevelEnum.PUBLIC,
  })
  @IsEnum(privacyLevelEnum)
  privacyLevel: privacyLevelEnum;
}
