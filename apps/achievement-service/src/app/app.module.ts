import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MessagingModule } from '@gitcode/messaging';
import { ConfigModule } from '@nestjs/config';
import envValidation from './config/env.validation';
import rabbitmqConfig from './config/rabbitmq.config';
import appConfig from './config/app.config';
import { AchievementModule } from '../achievement/achievement.module';

@Module({
  imports: [
    PrismaModule,
    MessagingModule.forRoot([process.env.RABBITMQ_URL]),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, rabbitmqConfig],
      validationSchema: envValidation,
    }),
    AchievementModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
