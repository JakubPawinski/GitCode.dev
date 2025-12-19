import { IsEnum, IsString } from 'class-validator';
import { themeEnum } from '@gitcode/types';
import { privacyLevelEnum } from '@gitcode/types';
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
    enum: privacyLevelEnum,
    description: 'Privacy level preference',
    example: privacyLevelEnum.PUBLIC,
  })
  @IsEnum(privacyLevelEnum)
  privacyLevel: privacyLevelEnum;
}
