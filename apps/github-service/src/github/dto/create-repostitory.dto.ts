import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateRepositoryDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  private?: boolean;

  @IsBoolean()
  @IsOptional()
  autoInit?: boolean;
}
