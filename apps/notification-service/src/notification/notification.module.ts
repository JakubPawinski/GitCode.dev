import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './providers/notification.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { NotificationConsumer } from './notification.consumer';

@Module({
  controllers: [NotificationController, NotificationConsumer],
  providers: [NotificationService],
  imports: [PrismaModule, RealtimeModule],
})
export class NotificationModule {}
