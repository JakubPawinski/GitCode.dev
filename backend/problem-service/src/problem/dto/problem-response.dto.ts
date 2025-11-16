export class ProblemResponseDto {
  problemId: string;
  title: string;
  difficulty: string;
  problemSlug: string;
  description: string;
  topics: string[];
  examples: Array<{
    inputText: string;
    outputText: string;
  }>;
  constraints: string[];
  hints: Array<{
    hintText: string;
    orderIndex: number;
  }>;
  testCases: Array<{
    input: string;
    expectedOutput: string;
  }>;
  similarProblems: Array<{
    title: string;
    problemSlug: string;
    description: string;
    difficulty: string;
  }>;
}
