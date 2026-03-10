import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MessagingModule } from '@gitcode/messaging';
import { ConfigModule } from '@nestjs/config';
import envValidation from './config/env.validation';
import rabbitmqConfig from './config/rabbitmq.config';
import appConfig from './config/app.config';
import jwtConfig from './config/jwt.config';
import { AchievementModule } from '../achievement/achievement.module';
import { GitCodeAuthModule } from '@gitcode/auth';

@Module({
  imports: [
    PrismaModule,
    MessagingModule.forRoot([process.env.RABBITMQ_URL]),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, rabbitmqConfig, jwtConfig],
      validationSchema: envValidation,
    }),
    AchievementModule,
    GitCodeAuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
