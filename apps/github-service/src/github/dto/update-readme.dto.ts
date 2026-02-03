import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateReadmeDto {
  @ApiProperty({
    description: 'README.md content in markdown',
    example: '# My GitCode Solutions\n\n## Problems Solved\n...',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
