import { Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Type as ValidateType } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { EventEnvelopeDto } from '../dtos/event-envelope.dto.js';

export function WithEventPayload<T>(
  payloadDto: Type<T>,
): Type<EventEnvelopeDto<T>> {
  class EventEnvelopeMixin extends EventEnvelopeDto<T> {
    @ApiProperty({ type: payloadDto })
    @ValidateNested()
    @ValidateType(() => payloadDto)
    override payload!: T;
  }

  Object.defineProperty(EventEnvelopeMixin, 'name', {
    value: `${payloadDto.name}Envelope`,
  });

  return EventEnvelopeMixin as Type<EventEnvelopeDto<T>>;
}
