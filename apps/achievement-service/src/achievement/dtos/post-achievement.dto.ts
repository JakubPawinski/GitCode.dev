import { OmitType } from '@nestjs/swagger';
import { GetAchievementDto } from './get-achievemeent.dto';

export class PostAchievementDto extends OmitType(GetAchievementDto, [
  'id',
] as const) {}
