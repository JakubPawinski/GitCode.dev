import { OmitType } from '@nestjs/swagger';
import { GetAchievementDto } from './get-achievement.dto';

export class PostAchievementDto extends OmitType(GetAchievementDto, [
  'id',
] as const) {}
