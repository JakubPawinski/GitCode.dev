import { Module } from '@nestjs/common';
import { createPrismaConnectionModule } from '@gitcode/prisma-connection';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client-problem';
import { TokenName } from '../shared/token-name.enum.ts';

const BaseProblemPrismaModule = createPrismaConnectionModule(PrismaClient, TokenName.PRISMA_PROBLEM)

@Module({
  imports: [
    BaseProblemPrismaModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connectionString: configService.getOrThrow<string>('database.url'),
      }),
    }),
  ],
  exports: [BaseProblemPrismaModule],
})
export class ProblemPrismaModule {}