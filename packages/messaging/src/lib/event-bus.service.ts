import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { EventEnvelopeDto } from './dtos/event-envelope.dto.js';

@Injectable()
export class EventBus {
  private readonly logger = new Logger(EventBus.name);
  constructor(private readonly amqpConnection: AmqpConnection) {}

  public async publish<T>(
    pattern: string,
    payload: T,
    correlationId?: string,
  ): Promise<void> {
    const envelope = EventEnvelopeDto.create(pattern, payload, correlationId);

    this.logger.log(`Publishing event to pattern ${pattern}`);

    try {
      await this.amqpConnection.publish('gitcode_exchange', pattern, envelope, {
        correlationId: envelope.correlationId,
        messageId: envelope.eventId,
        timestamp: new Date(envelope.occurredOn).getTime(),
      });
      this.logger.debug(`Event published to pattern ${pattern}`);
    } catch (error) {
      this.logger.error(`[EventBus] Failed to publish ${pattern}`, error);
      throw error;
    }
  }
}
