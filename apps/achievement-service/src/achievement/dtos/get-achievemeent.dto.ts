import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsUrl, IsUUID } from 'class-validator';

export class GetAchievementDto {
  @IsUUID()
  @ApiProperty({
    description: 'Unique identifier of the achievement',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @IsString()
  @ApiProperty({
    description: 'Name of the achievement',
    example: 'First Commit',
  })
  name: string;

  @IsString()
  @ApiProperty({
    description: 'Description of the achievement',
    example: 'Awarded for making the first commit',
  })
  describtion: string;

  @IsUrl()
  @ApiProperty({
    description: 'Icon URL of the achievement',
    example: 'https://example.com/achievement-icon.png',
  })
  iconUrl: string;

  @IsString()
  @ApiProperty({
    description: 'Type of the achievement event',
    example: 'commit',
  })
  eventType: string;

  @IsInt()
  @ApiProperty({
    description: 'Target value for the achievement',
    example: 1,
  })
  targetValue: number;
}
