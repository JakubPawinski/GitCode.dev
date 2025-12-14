export class EventEnvelope<T> {
  constructor(
    public readonly event: string,
    public readonly payload: T,
    public readonly eventId: string = crypto.randomUUID(),
    public readonly occurredOn: Date = new Date(),
    public readonly correlationId?: string,
  ) {}

  public static create<T>(
    event: string,
    payload: T,
    correlationId?: string,
  ): EventEnvelope<T> {
    return new EventEnvelope<T>(
      event,
      payload,
      undefined,
      undefined,
      correlationId,
    );
  }
}
