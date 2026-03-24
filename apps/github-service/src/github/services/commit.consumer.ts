import { Controller, Logger } from '@nestjs/common';
import {
  RabbitSubscribe,
  RabbitPayload,
  MessageHandlerErrorBehavior,
} from '@golevelup/nestjs-rabbitmq';
import { AI_PATTERNS } from '@gitcode/contracts';
import { RABBIT_CONFIG } from '../../app/config/rabbitmq.config';
import { ReadmeGeneratedEnvelope } from '../events/envelopes';
import { CommitService } from './commit.service';

@Controller()
export class CommitConsumer {
  private readonly logger = new Logger(CommitConsumer.name);

  constructor(private readonly commitService: CommitService) {}

  /*
   * Handle user created events to sync users to the github-service database
   */
  @RabbitSubscribe({
    exchange: RABBIT_CONFIG.EXCHANGE,
    routingKey: AI_PATTERNS.README_GENERATED,
    queue: `${RABBIT_CONFIG.QUEUE}_readme_generated`,
    errorBehavior: MessageHandlerErrorBehavior.NACK,
  })
  async handleReadmeGenerated(
    @RabbitPayload()
    event: ReadmeGeneratedEnvelope,
  ): Promise<void> {
    this.logger.log(`Readme generated event received: ${event.payload.userId}`);
    this.logger.debug(`Readme content: ${JSON.stringify(event.payload)}`);
    try {
      await this.commitService.updateReadme(
        event.payload.userId,
        event.payload.readmeContent,
      );
      this.logger.log(`Readme updated for user: ${event.payload.userId}`);
    } catch (error) {
      this.logger.error(`Failed to update readme: ${error.message}`);
    }
  }
}
