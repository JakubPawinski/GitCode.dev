import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';

import databaseConfig from './config/database.config';
import rabbitmqConfig from './config/rabbitmq.config';
import envValidation from './config/env.validation';
import { NotificationModule } from '../notification/notification.module';
import { GitCodeAuthModule } from '@gitcode/auth';
import jwtConfig from './config/jwt.config';
import { MessagingModule } from '@gitcode/messaging';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, rabbitmqConfig, jwtConfig],
      validationSchema: envValidation,
    }),
    NotificationModule,
    GitCodeAuthModule,
    MessagingModule.forRoot([process.env.RABBITMQ_URL]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
