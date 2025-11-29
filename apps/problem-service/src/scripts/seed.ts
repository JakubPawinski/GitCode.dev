import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface Problem {
  title: string;
  problem_id: string;
  frontend_id: string;
  difficulty: string;
  problem_slug: string;
  description: string;
  topics: string[];
  examples: Array<{
    example_num: number;
    example_text: string;
    images: string[];
  }>;
  constraints: string[];
  follow_ups: string[];
  hints: string[];
  code_snippets: Record<string, string>;
  solution?: string;
  test_input_output?: Array<{
    input: Record<string, any> | any;
    output: any;
  }>;
  similar_question_ids?: string | string[];
}

// Helper: Parse example text to extract input/output
function parseExampleText(text: string): { input: string; output: string } {
  const inputMatch = text.match(/Input:\s*(.+?)(?=\n|Output:|$)/s);
  const outputMatch = text.match(/Output:\s*(.+?)(?=\n|Explanation:|$)/s);

  const input = inputMatch ? inputMatch[1].trim() : '';
  const output = outputMatch ? outputMatch[1].trim() : '';

  return { input, output };
}

async function main() {
  try {
    console.log('Starting database seed...');

    const filePath = path.join(
      process.cwd(),
      'resources',
      'merged_problems.json',
    );

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const problems: Problem[] = JSON.parse(fileContent);

    if (!Array.isArray(problems)) {
      throw new Error('JSON file must contain an array of problems');
    }

    console.log(`Found ${problems.length} problems to seed`);

    let successCount = 0;
    let errorCount = 0;
    const similarProblemsToCreate: Array<{
      problemId: string;
      similarIds: string[];
    }> = [];

    // Phase 1: Create all problems
    for (const problem of problems) {
      try {
        if (
          !problem.test_input_output ||
          problem.test_input_output.length === 0
        ) {
          console.log(`Skipping ${problem.title} - no test cases`);
          continue;
        }

        const existingProblem = await prisma.problem.findFirst({
          where: { problemId: problem.problem_id },
        });

        if (existingProblem) {
          console.log(`Already seeded: ${problem.title}`);
          continue;
        }

        // Use transaction for data consistency
        let createdProblemId: string = '';
        await prisma.$transaction(async (tx) => {
          const createdProblem = await tx.problem.create({
            data: {
              problemId: problem.problem_id,
              frontendId: problem.frontend_id,
              title: problem.title,
              difficulty: problem.difficulty.toUpperCase() as any,
              problemSlug: problem.problem_slug,
              description: problem.description,
              solutions: problem.solution,
            },
          });
          createdProblemId = createdProblem.id;

          // Create Topics
          if (problem.topics?.length > 0) {
            await tx.problemTopic.createMany({
              data: problem.topics.map((topic) => ({
                problemId: createdProblem.id,
                topic,
              })),
            });
          }

          // Create Examples
          if (problem.examples?.length > 0) {
            const examplesData = problem.examples.map((example) => {
              const { input, output } = parseExampleText(example.example_text);
              return {
                problemId: createdProblem.id,
                exampleNum: example.example_num,
                inputText: input,
                outputText: output,
              };
            });
            await tx.example.createMany({ data: examplesData });
          }

          // Create Constraints
          if (problem.constraints?.length > 0) {
            await tx.constraint.createMany({
              data: problem.constraints.map((constraint, index) => ({
                problemId: createdProblem.id,
                constraint,
                orderIndex: index,
              })),
            });
          }

          // Create Hints
          if (problem.hints?.length > 0) {
            await tx.hint.createMany({
              data: problem.hints.map((hint, index) => ({
                problemId: createdProblem.id,
                hintText: hint,
                orderIndex: index,
              })),
            });
          }

          // Create Follow Ups
          if (problem.follow_ups?.length > 0) {
            await tx.followUp.createMany({
              data: problem.follow_ups.map((followUp, index) => ({
                problemId: createdProblem.id,
                question: followUp,
                orderIndex: index,
              })),
            });
          }

          // Create Test Cases
          if (
            problem.test_input_output &&
            problem.test_input_output.length > 0
          ) {
            await tx.testCase.createMany({
              data: problem.test_input_output.map((testCase, index) => {
                const inputJson = JSON.stringify(testCase.input);
                const outputJson = JSON.stringify(testCase.output);

                return {
                  problemId: createdProblem.id,
                  input: inputJson,
                  expectedOutput: outputJson,
                  isPublic: index < 5,
                  orderIndex: index,
                };
              }),
            });

            console.log(`Added ${problem.test_input_output.length} test cases`);
          }

          // Create Code Snippets
          if (
            problem.code_snippets &&
            Object.keys(problem.code_snippets).length > 0
          ) {
            await tx.codeSnippet.createMany({
              data: Object.entries(problem.code_snippets).map(
                ([language, code]) => ({
                  problemId: createdProblem.id,
                  language,
                  starterCode: code,
                }),
              ),
            });
          }
        });

        // Store similar problems for later processing
        if (problem.similar_question_ids) {
          const similarIds =
            typeof problem.similar_question_ids === 'string'
              ? problem.similar_question_ids.split(',').map((id) => id.trim())
              : problem.similar_question_ids;

          similarProblemsToCreate.push({
            problemId: problem.problem_id,
            similarIds,
          });
        }

        console.log(`Seeded: ${problem.title}`);
        successCount++;
      } catch (error) {
        console.error(`Error seeding ${problem.title}:`, error);
        errorCount++;
      }
    }

    // Phase 2: Create all similar problem relationships
    console.log(`\nCreating similar problem relationships...`);
    for (const { problemId, similarIds } of similarProblemsToCreate) {
      const fromProblem = await prisma.problem.findFirst({
        where: { problemId },
      });

      if (!fromProblem) {
        console.log(`Problem not found: ${problemId}`);
        continue;
      }

      console.log(`\nProblem: ${fromProblem.title} (${problemId})`);
      console.log(` Similar IDs: ${similarIds.join(', ')}`);

      for (const similarProblemId of similarIds) {
        const toProblem = await prisma.problem.findFirst({
          where: { problemId: similarProblemId },
        });

        if (!toProblem) {
          console.log(`Similar problem NOT FOUND: ${similarProblemId}`);
          continue;
        }

        const existingRelationship = await prisma.similarProblem.findFirst({
          where: {
            problemFromId: fromProblem.id,
            problemToId: toProblem.id,
          },
        });

        if (!existingRelationship) {
          await prisma.similarProblem.create({
            data: {
              problemFromId: fromProblem.id,
              problemToId: toProblem.id,
            },
          });
          console.log(`Created link to: ${toProblem.title}`);
        } else {
          console.log(` Link already exists`);
        }
      }
    }

    console.log(`\n Database seed completed!`);
    console.log(`✅ Success: ${successCount} | ❌ Errors: ${errorCount}`);
  } catch (error) {
    console.error(' Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
