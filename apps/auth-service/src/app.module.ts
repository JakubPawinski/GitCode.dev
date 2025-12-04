import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SocialModule } from './social/social.module';
import configuration from './config/configuration';
import { GitCodeCommonModule } from '@gitcode/common';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    AuthModule,
    PrismaModule,
    RedisModule,
    UsersModule,
    SocialModule,
    GitCodeCommonModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
