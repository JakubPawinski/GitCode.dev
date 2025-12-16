import { ApiProperty } from '@nestjs/swagger';

export class TestResultDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  testIndex: number;

  @ApiProperty()
  passed: boolean;

  @ApiProperty({ nullable: true })
  input: string | null;

  @ApiProperty({ nullable: true })
  expectedOutput: string | null;

  @ApiProperty({ nullable: true })
  actualOutput: string | null;

  @ApiProperty({ nullable: true })
  errorMessage: string | null;
}

export class AttemptDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  attemptNumber: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  language: string;

  @ApiProperty({ nullable: true })
  executionTime: number | null;

  @ApiProperty({ nullable: true })
  memoryUsed: number | null;

  @ApiProperty()
  passedTests: number;

  @ApiProperty()
  failedTests: number;

  @ApiProperty()
  totalTests: number;

  @ApiProperty({ nullable: true })
  errorMessage: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ nullable: true })
  completedAt: Date | null;

  @ApiProperty({ type: [TestResultDto] })
  testResults: TestResultDto[];
}

export class SubmissionDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  problem: {
    id: string;
    title: string;
    problemSlug: string;
    difficulty: string;
    description: string;
  };

  @ApiProperty()
  isSolved: boolean;

  @ApiProperty()
  currentCode: string;

  @ApiProperty()
  currentLanguage: string;

  @ApiProperty()
  totalTestCases: number;

  @ApiProperty({ nullable: true })
  githubUrl: string | null;

  @ApiProperty({ nullable: true })
  commitHash: string | null;

  @ApiProperty({ nullable: true })
  solvedAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  submittedAt: Date | null;

  @ApiProperty({ type: [AttemptDetailDto] })
  attempts: AttemptDetailDto[];

  @ApiProperty({ type: [Object] })
  feedbacks: any[];
}
