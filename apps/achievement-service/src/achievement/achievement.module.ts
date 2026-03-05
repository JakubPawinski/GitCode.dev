import { Module } from '@nestjs/common';
import { AchievementController } from './achievement.controller';
import { AchievementService } from './achievement.service';

@Module({
  controllers: [AchievementController],
  providers: [AchievementService],
})
export class AchievementModule {}
