import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SocialModule } from './social/social.module';
import configuration from './config/configuration';
import { GitCodeCommonModule } from '@gitcode/common';
import { AuthPrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { GitCodeAuthModule } from '@gitcode/auth';
import { MessagingModule } from '@gitcode/messaging';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    AuthModule,
    AuthPrismaModule,
    RedisModule,
    UsersModule,
    SocialModule,
    GitCodeCommonModule,
    GitCodeAuthModule,
    MessagingModule.forRoot([process.env.RABBITMQ_URL]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
