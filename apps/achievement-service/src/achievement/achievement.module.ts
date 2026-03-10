import { Module } from '@nestjs/common';
import { AchievementController } from './achievement.controller';
import { AchievementService } from './achievement.service';
import { AchievementConsumerController } from './achievement.consumer.controller';
import { AchievementEventMapperService } from './achievement-event-mapper.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [AchievementController, AchievementConsumerController],
  providers: [AchievementService, AchievementEventMapperService],
  imports: [PrismaModule],
})
export class AchievementModule {}
