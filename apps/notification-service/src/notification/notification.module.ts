import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './providers/notification.service';
import {
 NotificationPrismaModule
} from '../prisma/prisma.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { NotificationConsumer } from './notification.consumer';

@Module({
  controllers: [NotificationController, NotificationConsumer],
  providers: [NotificationService],
  imports: [NotificationPrismaModule, RealtimeModule],
})
export class NotificationModule {}
