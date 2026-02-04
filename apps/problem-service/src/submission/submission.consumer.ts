import { Controller, Logger } from '@nestjs/common';
import {
  MessageHandlerErrorBehavior,
  RabbitPayload,
  RabbitSubscribe,
} from '@golevelup/nestjs-rabbitmq';
import { RABBIT_CONFIG } from '../config/rabbitmq.config';
import { AI_PATTERNS, GITHUB_PATTERNS } from '@gitcode/contracts';
import {
  SubmissionAnalyzedEnvelope,
  SubmissionFileCommittedEnvelope,
} from '../events/envelopes';
import { SubmissionService } from './submission.service';

@Controller()
export class SubmissionConsumer {
  private readonly logger = new Logger(SubmissionConsumer.name);

  constructor(private readonly submissionService: SubmissionService) {}

  @RabbitSubscribe({
    exchange: RABBIT_CONFIG.EXCHANGE,
    routingKey: AI_PATTERNS.SUBMISSION_ANALYZED,
    queue: `${RABBIT_CONFIG.QUEUE}_submission_analyzed`,
    errorBehavior: MessageHandlerErrorBehavior.NACK,
  })
  public async handleSubmissionAnalyzedEvent(
    @RabbitPayload() event: SubmissionAnalyzedEnvelope,
  ) {
    const submissionId = event.payload.submissionId;

    try {
      this.logger.log(
        `Received SubmissionAnalyzedEvent for submissionId: ${submissionId}`,
      );

      await this.submissionService.handleAiAnalysisResult(
        submissionId,
        event.payload,
      );

      this.logger.log(
        `Successfully processed AI analysis for submissionId: ${submissionId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing AI analysis for submissionId: ${submissionId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: RABBIT_CONFIG.EXCHANGE,
    routingKey: GITHUB_PATTERNS.FILE_COMMITTED,
    queue: `${RABBIT_CONFIG.QUEUE}_submission_file_committed`,
    errorBehavior: MessageHandlerErrorBehavior.NACK,
  })
  public async handleSubmissionFileCommittedEvent(
    @RabbitPayload() event: SubmissionFileCommittedEnvelope,
  ) {
    const submissionId = event.payload.submissionId;

    try {
      this.logger.log(
        `Received SubmissionFileCommittedEvent for submissionId: ${submissionId}`,
      );

      await this.submissionService.handleFileCommitted(
        submissionId,
        event.payload,
      );

      this.logger.log(
        `Successfully processed file committed for submissionId: ${submissionId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing file committed for submissionId: ${submissionId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
