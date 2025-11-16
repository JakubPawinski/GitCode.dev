import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
@Injectable()
export class ProblemService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return `This action returns all problem`;
  }

  findOne(id: number) {
    return `This action returns a #${id} problem`;
  }

  async findProblemBySlug(slug: string) {
    const problem = await this.prisma.problem.findUnique({
      where: {
        problemSlug: slug,
      },
      select: {
        problemId: true,
        title: true,
        difficulty: true,
        problemSlug: true,
        description: true,
        topics: { select: { topic: true } },
        examples: { select: { inputText: true, outputText: true } },
        constraints: { select: { constraint: true } },
        hints: {
          select: { hintText: true, orderIndex: true },
          orderBy: { orderIndex: 'asc' },
        },
        testCases: {
          where: { isPublic: true },
          select: { input: true, expectedOutput: true },
          orderBy: { orderIndex: 'asc' },
        },
        similarProblems: {
          select: {
            problemTo: {
              select: {
                title: true,
                problemSlug: true,
                description: true,
                difficulty: true,
              },
            },
          },
        },
      },
    });

    if (!problem) {
      throw new NotFoundException(`Problem with slug "${slug}" not found`);
    }

    return {
      ...problem,
      topics: problem.topics.map((t) => t.topic),
      constraints: problem.constraints.map((c) => c.constraint),
      hints: problem.hints.map((h) => ({
        hintText: h.hintText,
        orderIndex: h.orderIndex,
      })),
      similarProblems: problem.similarProblems.map((p) => p.problemTo),
    };
  }

  remove(id: number) {
    return `This action removes a #${id} problem`;
  }
}
