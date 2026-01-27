import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProblemModule } from './problem/problem.module';
import { SubmissionModule } from './submission/submission.module';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { GitCodeCommonModule } from '@gitcode/common';
import { GitCodeAuthModule } from '@gitcode/auth';
import { MessagingModule } from '@gitcode/messaging';
import rabbitmqConfig from './config/rabbitmq.config';

@Module({
  imports: [
    ProblemModule,
    PrismaModule,
    SubmissionModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration, rabbitmqConfig],
      envFilePath: '.env',
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url:
            configService.get<string>('redis.url') || 'redis://localhost:6379',
        },
      }),
    }),
    GitCodeCommonModule,
    GitCodeAuthModule,
    MessagingModule.forRoot([process.env.RABBITMQ_URL]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
