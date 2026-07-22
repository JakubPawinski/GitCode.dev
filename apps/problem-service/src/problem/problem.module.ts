import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProblemService } from './problem.service';
import { ProblemController } from './problem.controller';
import { ProblemPrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    ConfigModule,
    ProblemPrismaModule,
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
  controllers: [ProblemController],
  providers: [ProblemService],
})
export class ProblemModule {}
