import { WithEventPayload } from '@gitcode/messaging';
import { SubmissionAnalyzedEvent } from '@gitcode/contracts';

export class SubmissionAnalyzedEnvelope extends WithEventPayload(
  SubmissionAnalyzedEvent,
) {}
