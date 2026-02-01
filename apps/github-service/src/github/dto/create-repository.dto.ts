import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateRepositoryDto {
  @ApiProperty({
    description: 'User ID from auth service',
    example: 'd33e23ba-de1b-406f-9fde-a00a48d560e0',
  })
  @IsString()
  userId: string;
}
