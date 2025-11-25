import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Operation successful' })
  message?: string;

  @ApiProperty()
  data?: T;

  @ApiProperty({ example: null })
  error?: {
    code: string;
    message: string;
    details?: any;
  };

  @ApiProperty({ example: '2025-11-02T14:30:45.123Z' })
  timestamp: string;

  @ApiProperty({ example: '/problem/problem-slug' })
  path?: string;
}
