import { ApiProperty } from '@nestjs/swagger';

export class TestDetailDto {
  @ApiProperty({ example: 0 })
  testIndex: number;

  @ApiProperty({ example: true })
  passed: boolean;

  @ApiProperty({ type: Object })
  input: Record<string, any>;

  @ApiProperty({ type: Object })
  expectedOutput: Record<string, any>;

  @ApiProperty({ type: Object, nullable: true })
  actualOutput: Record<string, any> | null;

  @ApiProperty({ nullable: true })
  errorMessage: string | null;
}

export class AttemptDetailsDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ['success', 'failed', 'pending', 'error'] })
  status: string;

  @ApiProperty({ example: 8 })
  passedTests: number;

  @ApiProperty({ example: 2 })
  failedTests: number;

  @ApiProperty({ example: 10 })
  totalTests: number;

  @ApiProperty({ nullable: true })
  executionTime: number | null;

  @ApiProperty({ nullable: true })
  memoryUsed: number | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ nullable: true })
  completedAt: Date | null;

  @ApiProperty({ type: [TestDetailDto] })
  testResults: TestDetailDto[];

  @ApiProperty({ type: [TestDetailDto] })
  failedTestsDetails: TestDetailDto[];
}
