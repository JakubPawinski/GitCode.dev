import { PartialType } from '@nestjs/mapped-types';
import { GetPreferencesDto } from './get-preferences.dto';

export class PatchPreferencesDto extends PartialType(GetPreferencesDto) {}
    