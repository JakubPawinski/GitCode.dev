import { OmitType, PartialType } from '@nestjs/swagger';
import { PostNotificationDto } from './post-notification.dto';

export class PatchNotificationDto extends PartialType(
  OmitType(PostNotificationDto, ['userId'] as const),
) {}
