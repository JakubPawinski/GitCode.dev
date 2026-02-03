import { WithEventPayload } from '@gitcode/messaging';
import {
  SubmissionAnalyzedEvent,
  FileCommittedEvent,
} from '@gitcode/contracts';

export class SubmissionAnalyzedEnvelope extends WithEventPayload(
  SubmissionAnalyzedEvent,
) {}

export class SubmissionFileCommittedEnvelope extends WithEventPayload(
  FileCommittedEvent,
) {}
