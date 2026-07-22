
import { PrismaClient } from '@prisma/client-auth';
import { createPrismaConnectionModule} from '@gitcode/prisma-connection'
import { TokenName } from '../shared/enums/nest-token.enum.ts';
import { ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';

export const BaseAuthPrismaModule = createPrismaConnectionModule(PrismaClient, TokenName.PRISMA_CONNECTION);


@Module({
  imports: [
    BaseAuthPrismaModule.forRootAsync(
      {
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          connectionString: configService.getOrThrow<string>('database.url'),
        })
      }
    )
  ],
  exports: [
    BaseAuthPrismaModule,
  ]
})
export class AuthPrismaModule {}