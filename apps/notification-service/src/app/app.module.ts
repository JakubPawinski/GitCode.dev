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
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, rabbitmqConfig, jwtConfig],
      validationSchema: envValidation,
    }),
    NotificationModule,
    GitCodeAuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
