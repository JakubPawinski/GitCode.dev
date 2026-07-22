import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GithubModule } from '../github/github.module';
import { GitCodeAuthModule } from '@gitcode/auth';
import rabbitmqConfig from './config/rabbitmq.config';
import { MessagingModule } from '@gitcode/messaging';
import appConfig from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
      load: [
        () => ({
          jwt: {
            secret: process.env.JWT_SECRET || 'your-secret-key',
            accessExpiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m',
          },
        }),
        rabbitmqConfig,
        appConfig,
      ],
    }),
    GitCodeAuthModule,
    GithubModule,
    MessagingModule.forRoot([process.env.RABBITMQ_URL]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
