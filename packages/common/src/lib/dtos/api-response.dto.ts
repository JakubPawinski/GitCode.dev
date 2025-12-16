import { ApiProperty } from '@nestjs/swagger';
import { ApiResponse } from '@gitcode/types';

export class ApiResponseDto<T> implements ApiResponse<T> {
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

  @ApiProperty({ example: '/auth/login' })
  path?: string;
}
