import { IsInt } from 'class-validator';
import { GetAchievementDto } from './get-achievemeent.dto';
import { ApiProperty } from '@nestjs/swagger';

export class GetAchievementProgressDto extends GetAchievementDto {
  @IsInt()
  @ApiProperty({
    description: 'Progress towards the achievement',
    example: 15,
  })
  progress: number;
}
