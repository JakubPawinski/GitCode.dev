import { Module } from '@nestjs/common';
import { createPrismaConnectionModule } from '@gitcode/prisma-connection';
import { PrismaClient } from '@prisma/client-notification';
import { TokenName } from '../shared/token-name.enum.ts';
import { ConfigService } from '@nestjs/config';

const BaseNotificationPrismaModule = createPrismaConnectionModule(PrismaClient, TokenName.PRISMA_NOTIFICATION)

@Module({
  imports: [
    BaseNotificationPrismaModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connectionString: configService.getOrThrow<string>('database.url'),
      }),
    }),
  ],
  exports: [BaseNotificationPrismaModule],
})
export class NotificationPrismaModule {}