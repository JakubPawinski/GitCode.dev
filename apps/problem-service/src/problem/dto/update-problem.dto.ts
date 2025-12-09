import { PartialType } from '@nestjs/mapped-types';
import { IsString } from 'class-validator';
import { CreateProblemDto } from './create-problem.dto';

export class UpdateProblemDto extends PartialType(CreateProblemDto) {
  @IsString()
  id: string;
}
