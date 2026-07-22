import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './providers/auth.service';
import { AuthController } from './auth.controller';
import { AuthPrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { AppService } from '../app.service';
import { OauthService } from './providers/oauth.service';
import { SessionService } from './providers/session.service';

@Module({
  imports: [
    AuthPrismaModule,
    RedisModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('jwt.secret'),
        signOptions: {
          expiresIn: configService.get('jwt.accessExpiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AppService, OauthService, SessionService],
  exports: [AuthService],
})
export class AuthModule {}
