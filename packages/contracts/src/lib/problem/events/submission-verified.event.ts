export class SubmissionVerifiedEvent {
  constructor(
    public readonly submissionId: string,
    public readonly userId: string,
    public readonly problemId: string,

    public readonly status: string,

    public readonly executionTimeMs: number,
    public readonly memoryUsageKb: number,

    public readonly isSuccess: boolean,

    public readonly problemTitle: string,

    public readonly occurredAt: Date = new Date(),
  ) {}
}
