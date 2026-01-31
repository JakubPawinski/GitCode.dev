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

export class AiFeedbackDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({
    example: 'optimization',
    description: 'Type of feedback: style, optimization, hint, explanation',
  })
  feedbackType: string;

  @ApiProperty({ example: 'You can combine the loops to improve performance.' })
  content: string;

  @ApiProperty({ example: 'info', nullable: true })
  severity: string | null;

  @ApiProperty()
  createdAt: Date;
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

  @ApiProperty({
    type: AiFeedbackDto,
    nullable: true,
    description: 'AI Feedback associated with this specific attempt',
  })
  feedbacks: AiFeedbackDto | null;

  @ApiProperty({ nullable: true })
  completedAt: Date | null;

  @ApiProperty({ type: [TestDetailDto] })
  testResults: TestDetailDto[];

  @ApiProperty({ type: [TestDetailDto] })
  failedTestsDetails: TestDetailDto[];
}
