export class NotificationCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly type: string,
    public readonly kind: string,
    public readonly payload: any,
  ) {}
}
