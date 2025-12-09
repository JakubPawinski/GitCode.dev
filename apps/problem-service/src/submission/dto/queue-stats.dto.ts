import { ApiProperty } from '@nestjs/swagger';

export class QueueStatsDto {
  @ApiProperty({ example: 1 })
  active: number;

  @ApiProperty({ example: 5 })
  waiting: number;

  @ApiProperty({ example: 6 })
  total: number;

  @ApiProperty({ example: 1 })
  position: number;

  @ApiProperty({ example: 2500 })
  estimatedWaitTime: number;
}
