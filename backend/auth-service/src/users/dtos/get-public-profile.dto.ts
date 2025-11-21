import { OmitType } from '@nestjs/swagger';
import { GetProfileDto } from './get-profile.dto';

export class GetPublicProfileDto extends OmitType(GetProfileDto, [
  'email',
  'emailVerified',
  'roles',
] as const) {}
