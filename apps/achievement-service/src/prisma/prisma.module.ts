import { Module } from '@nestjs/common';
import { createPrismaConnectionModule } from "@gitcode/prisma-connection"
import { PrismaClient } from '@prisma/client-achievement';
import { TokenName } from '../shared/token-name.enum.ts';
import { ConfigService } from '@nestjs/config';

const BaseAchievementPrismaModule = createPrismaConnectionModule(PrismaClient, TokenName.PRISMA_ACHIEVEMENT)

@Module({
  imports: [
    BaseAchievementPrismaModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connectionString: configService.getOrThrow<string>('app.DB_URL'),
      }),
    }),
  ],
  exports: [BaseAchievementPrismaModule],
})
export class AchievementPrismaModule {}