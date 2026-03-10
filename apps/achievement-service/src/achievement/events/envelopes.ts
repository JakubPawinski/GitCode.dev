import { SubmissionCompletedEvent } from '@gitcode/contracts';
import { WithEventPayload } from '@gitcode/messaging';

export class SubmissionCompletedEnvelope extends WithEventPayload(
  SubmissionCompletedEvent,
) {}
