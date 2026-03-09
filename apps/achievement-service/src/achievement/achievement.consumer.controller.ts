import { Controller, Logger } from '@nestjs/common';
import { AchievementService } from './achievement.service';
import { RABBIT_CONFIG } from '../app/config/rabbitmq.config';
import { SUBMISSION_PATTERNS } from '@gitcode/contracts';
import {
  MessageHandlerErrorBehavior,
  RabbitPayload,
  RabbitSubscribe,
} from '@golevelup/nestjs-rabbitmq';
import { SubmissionCompletedEnvelope } from './events/envelopes';

@Controller()
export class AchievementConsumerController {
  private readonly logger = new Logger(AchievementConsumerController.name);

  constructor(private readonly achievementService: AchievementService) {}

  @RabbitSubscribe({
    exchange: RABBIT_CONFIG.EXCHANGE,
    routingKey: SUBMISSION_PATTERNS.SUBMISSION_COMPLETED,
    queue: `${RABBIT_CONFIG.QUEUE}_submission_completed`,
    errorBehavior: MessageHandlerErrorBehavior.NACK,
  })
  async handleSubmissionCompletedEvent(
    @RabbitPayload() event: SubmissionCompletedEnvelope,
  ): Promise<void> {
    this.logger.log(`Received event for user ${event.payload.userId}`);
    await this.achievementService.handleSubmissionCompletedEvent(event);
  }
}
