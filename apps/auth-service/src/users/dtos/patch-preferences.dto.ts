import { PartialType } from '@nestjs/swagger';
import { GetPreferencesDto } from './get-preferences.dto';

export class PatchPreferencesDto extends PartialType(GetPreferencesDto) {}
