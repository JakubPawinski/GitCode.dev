import { Module } from '@nestjs/common';
import { createPrismaConnectionModule } from '@gitcode/prisma-connection'
import { PrismaClient } from '@prisma/client-github';
import { TokenName } from '../shared/token-name.enum.ts';
import { ConfigService } from '@nestjs/config';

const BaseGithubPrismaModule = createPrismaConnectionModule(PrismaClient, TokenName.PRISMA_GITHUB)

@Module({
  imports: [
    BaseGithubPrismaModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connectionString: configService.getOrThrow<string>('app.DB_URL'),
      }),
    }),
  ],
  exports: [BaseGithubPrismaModule],
})
export class GithubPrismaModule {}