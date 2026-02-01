import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateReadmeDto {
  @ApiProperty({
    description: 'User ID from auth service',
    example: 'd33e23ba-de1b-406f-9fde-a00a48d560e0',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'README.md content in markdown',
    example: '# My GitCode Solutions\n\n## Problems Solved\n...',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
