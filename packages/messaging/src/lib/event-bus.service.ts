import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { EventEnvelope } from './event-envelope.js';

@Injectable()
export class EventBus {
  private readonly logger = new Logger(EventBus.name);
  constructor(
    @Inject('RABBITMQ_CLIENT') private readonly rabbitMqClient: ClientProxy,
  ) {}

  public async publish<T>(
    pattern: string,
    payload: T,
    correlationId?: string,
  ): Promise<void> {
    const envelope = EventEnvelope.create(pattern, payload, correlationId);

    this.logger.log(`Publishing event to pattern ${pattern}`);

    try {
      await firstValueFrom(this.rabbitMqClient.emit(pattern, envelope));
    } catch (error) {
      this.logger.error(`[EventBus] Failed to publish ${pattern}`, error);
      throw error;
    }
  }
}
