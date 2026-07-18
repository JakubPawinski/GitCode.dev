import { Controller, Inject, Logger } from '@nestjs/common';
import {
  RabbitSubscribe,
  RabbitPayload,
  MessageHandlerErrorBehavior,
} from '@golevelup/nestjs-rabbitmq';
import { AUTH_PATTERNS } from '@gitcode/contracts';
import { RABBIT_CONFIG } from '../app/config/rabbitmq.config';
import { UserCreatedEnvelope } from './events/envelopes';
import { TokenName } from '../shared/token-name.enum.ts';
import { PrismaClient } from '@prisma/client/extension';

@Controller()
export class UserConsumer {
  private readonly logger = new Logger(UserConsumer.name);

  constructor(
    @Inject(TokenName.PRISMA_GITHUB) private readonly prismaConnectionService: PrismaClient) {}

  /*
   * Handle user created events to sync users to the github-service database
   */
  @RabbitSubscribe({
    exchange: RABBIT_CONFIG.EXCHANGE,
    routingKey: AUTH_PATTERNS.USER_CREATED,
    queue: `${RABBIT_CONFIG.QUEUE}_user_created`,
    errorBehavior: MessageHandlerErrorBehavior.NACK,
  })
  async handleUserCreated(
    @RabbitPayload()
    event: UserCreatedEnvelope,
  ): Promise<void> {
    this.logger.log(`User created event received: ${event.payload.userId}`);

    try {
      await this.prismaConnectionService.user.create({
        data: {
          userId: event.payload.userId,
          username: event.payload.username,
          email: event.payload.email,
          tier: 'FREE',
        },
      });

      this.logger.log(
        `User ${event.payload.userId} synced to github-service database`,
      );
    } catch (error) {
      this.logger.error(`Failed to sync user: ${error.message}`);
    }
  }
}
