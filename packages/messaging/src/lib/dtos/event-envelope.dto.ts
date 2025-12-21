import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsISO8601,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class EventEnvelopeDto<T> {
  @IsString()
  @IsNotEmpty()
  event: string;

  @ValidateNested()
  @Type(() => Object)
  payload: T;

  @IsUUID()
  eventId: string;

  @IsISO8601()
  occurredOn: string;

  @IsOptional()
  @IsString()
  correlationId?: string;

  constructor(
    event: string,
    payload: T,
    eventId: string = crypto.randomUUID(),
    occurredOn: string = new Date().toISOString(),
    correlationId?: string,
  ) {
    this.event = event;
    this.payload = payload;
    this.eventId = eventId;
    this.occurredOn = occurredOn;
    this.correlationId = correlationId;
  }

  public static create<T>(
    event: string,
    payload: T,
    correlationId?: string,
  ): EventEnvelopeDto<T> {
    return new EventEnvelopeDto<T>(
      event,
      payload,
      crypto.randomUUID(),
      new Date().toISOString(),
      correlationId,
    );
  }
}
