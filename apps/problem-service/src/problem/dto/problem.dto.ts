import { ApiProperty } from '@nestjs/swagger';
import { Difficulty } from '@prisma/client-problem';

export class ProblemResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the problem',
    example: 'b2fd53c1-4385-4b69-b381-bbf7b0ed89b8',
  })
  id: string;

  @ApiProperty({ description: 'External problem ID', example: '1' })
  problemId: string;

  @ApiProperty({ description: 'Title of the problem', example: 'Two sum' })
  title: string;

  @ApiProperty({
    description: 'URL-friendly slug for the problem',
    example: 'two-sum',
  })
  problemSlug: string;

  @ApiProperty({
    description: 'Detailed description of the problem',
    example:
      'Given an array of integers nums and an integer target, return indices of the two numbers...',
  })
  description: string;

  @ApiProperty({
    description: 'Difficulty level of the problem',
    enum: Difficulty,
  })
  difficulty: Difficulty;

  @ApiProperty({
    description: 'List of topics/tags related to the problem',
    type: [String],
    example: ['Array', 'Hash Table'],
  })
  topics: string[];

  @ApiProperty({
    description: 'Similar problems recommendations',
    type: [Object],
    example: [
      {
        title: 'Three Sum',
        problemSlug: 'three-sum',
        difficulty: 'MEDIUM',
      },
    ],
  })
  similarProblems: Array<{
    title: string;
    problemSlug: string;
    difficulty: string;
  }>;
}

export class ProblemDetailResponseDto extends ProblemResponseDto {
  @ApiProperty({
    description: 'Problem examples with input and output',
    type: [Object],
    example: [
      {
        inputText: 'Input: nums = [2,7,11,15], target = 9',
        outputText: 'Output: [0,1]',
      },
    ],
  })
  examples: Array<{
    inputText: string;
    outputText: string;
  }>;

  @ApiProperty({
    description: 'Constraints and limitations of the problem',
    type: [String],
    example: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9'],
  })
  constraints: string[];

  @ApiProperty({
    description: 'Hints to solve the problem, ordered by difficulty',
    type: [Object],
    example: [
      {
        hintText: 'Think about the complement of each number',
        orderIndex: 0,
      },
    ],
  })
  hints: Array<{
    hintText: string;
    orderIndex: number;
  }>;

  @ApiProperty({
    description: 'Public test cases for the problem',
    type: [Object],
    example: [
      {
        input: { nums: [2, 7, 11, 15], target: 9 },
        expectedOutput: [0, 1],
      },
    ],
  })
  testCases: Array<{
    input: any;
    expectedOutput: any;
  }>;

  @ApiProperty({
    description: 'Code snippets for different programming languages',
    type: Object,
    example: {
      python: 'def twoSum(nums, target):\n    pass',
      javascript: 'function twoSum(nums, target) {\n    return null;\n}',
      cpp: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};',
      java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}',
    },
  })
  codeSnippets: Record<string, string>;

  @ApiProperty({
    description: 'Similar problems recommendations',
    type: [Object],
    example: [
      {
        title: 'Three Sum',
        problemSlug: 'three-sum',
        difficulty: 'MEDIUM',
      },
    ],
  })
  declare similarProblems: Array<{
    title: string;
    problemSlug: string;
    difficulty: string;
    description: string;
  }>;
}
