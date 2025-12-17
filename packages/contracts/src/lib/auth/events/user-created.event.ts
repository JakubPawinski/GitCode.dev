export class UserCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly firstName?: string,
    public readonly lastName?: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
