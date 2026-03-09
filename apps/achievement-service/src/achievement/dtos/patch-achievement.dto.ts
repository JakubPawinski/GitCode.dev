import { PartialType } from '@nestjs/swagger';
import { PostAchievementDto } from './post-achievement.dto';

export class PatchAchievementDto extends PartialType(PostAchievementDto) {}
