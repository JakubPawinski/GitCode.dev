import {
  IsString,
  IsEnum,
  IsArray,
  IsOptional,
  IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export class CreateProblemDto {
  @ApiProperty({ example: 'Two Sum' })
  @IsString()
  title: string;

  @ApiProperty({ example: '1' })
  @IsString()
  problemId: string;

  @ApiProperty({ example: '1' })
  @IsString()
  frontendId: string;

  @ApiProperty({ enum: DifficultyLevel, example: 'EASY' })
  @IsEnum(DifficultyLevel)
  difficulty: DifficultyLevel;

  @ApiProperty({ example: 'two-sum' })
  @IsString()
  problemSlug: string;

  @ApiProperty({
    example:
      'Given an array of integers nums and an integer target, return the indices of the two numbers...',
  })
  @IsString()
  description: string;

  @ApiProperty({ example: ['Array', 'Hash Table'] })
  @IsArray()
  @IsString({ each: true })
  topics: string[];

  @ApiProperty({
    example: [
      { example_num: 1, example_text: 'Input: nums = [2,7,11,15], target = 9' },
    ],
  })
  @IsOptional()
  @IsArray()
  examples?: Array<{
    example_num: number;
    example_text: string;
  }>;

  @ApiProperty({ example: ['1 <= nums.length <= 10^4'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  constraints?: string[];

  @ApiProperty({ example: ['Think about the complement of each number'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hints?: string[];

  @ApiProperty({
    example: {
      python: 'def twoSum(nums, target):\n    pass',
      javascript: 'function twoSum(nums, target) {}',
    },
  })
  @IsOptional()
  @IsObject()
  codeSnippets?: Record<string, string>;

  @ApiProperty({
    example: [{ input: { nums: [2, 7, 11, 15], target: 9 }, output: [0, 1] }],
  })
  @IsArray()
  testCases: Array<{
    input: Record<string, any> | any;
    output: any;
  }>;

  @ApiProperty({
    example: '<h2>Editorial Solution</h2>...',
    required: false,
  })
  @IsOptional()
  @IsString()
  solutions?: string;
}
