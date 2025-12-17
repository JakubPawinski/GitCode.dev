export class ProblemCreatedEvent {
  constructor(
    public readonly problemId: string,
    public readonly title: string,
    public readonly slug: string,
    public readonly difficulty: string,
    public readonly tags: string[],
    public readonly occurredAt: Date = new Date(),
  ) {}
}
