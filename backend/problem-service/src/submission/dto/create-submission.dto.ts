import { ApiProperty } from '@nestjs/swagger';

export class CreateSubmissionDto {
  @ApiProperty({
    description: 'Problem ID to submit solution for',
    example: 'b2fd53c1-4385-4b69-b381-bbf7b0ed89b8',
    type: String,
  })
  problemId: string;

  @ApiProperty({
    description: 'Source code of the solution',
    example: 'def twoSum(nums, target):\n    pass',
    type: String,
  })
  code: string;

  @ApiProperty({
    description: 'Programming language used',
    enum: ['python', 'javascript', 'java', 'cpp', 'golang'],
    example: 'python',
  })
  language: string;
}
