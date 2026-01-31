import { Controller } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { SubmissionService } from './submission.service';
import {
  MessageHandlerErrorBehavior,
  RabbitPayload,
  RabbitSubscribe,
} from '@golevelup/nestjs-rabbitmq';
import { RABBIT_CONFIG } from '../config/rabbitmq.config';
import { AI_PATTERNS } from '@gitcode/contracts';
import { SubmissionAnalyzedEnvelope } from '../events/envelopes';

@Controller()
export class SubmissionConsumer {
  private readonly logger = new Logger(SubmissionConsumer.name);

  constructor(
    private readonly submissionService: SubmissionService,
  ) {}

  /**
   * Handles the SubmissionAnalyzedEvent from the AI service.
   * @param event The event payload containing analysis results.
   */
  @RabbitSubscribe({
    exchange: RABBIT_CONFIG.EXCHANGE,
    routingKey: AI_PATTERNS.SUBMISSION_ANALYZED,
    queue: `${RABBIT_CONFIG.QUEUE}_submission_analyzed`,
    errorBehavior: MessageHandlerErrorBehavior.NACK,
  })
  public async handleSubmissionCompletedEvent(
    @RabbitPayload() event: SubmissionAnalyzedEnvelope,
  ) {
    this.logger.log(
      `Received SubmissionAnalyzedEvent for submissionId: ${JSON.stringify(
        event,
        null,
        2,
      )}`,
    );

    await this.submissionService.handleAiAnalysisResult(
      event.payload.submissionId,
      event.payload,
    );
    this.logger.log(
      `Processed AI analysis for submissionId: ${event.payload.submissionId}`,
    );
  }
}
