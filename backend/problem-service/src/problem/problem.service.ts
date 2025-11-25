import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginatedResult, PaginationDto } from './dto/pagination.dto';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';
@Injectable()
export class ProblemService {
  constructor(private prisma: PrismaService) {}

  async getPaginatedProblems(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<any>> {
    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || 10;
    const sortBy = paginationDto.sortBy || 'createdAt';
    const sortOrder = paginationDto.sortOrder || 'desc';
    const { difficulty, topic } = paginationDto;

    const where: any = {};

    if (difficulty) where.difficulty = difficulty.toUpperCase();
    if (topic) {
      const topics = topic.split(',').map((t) => t.trim());
      where.topics = {
        some: {
          topic: {
            in: topics,
            mode: 'insensitive',
          },
        },
      };
    }

    const total = await this.prisma.problem.count({ where });
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const data = await this.prisma.problem.findMany({
      where,
      skip,
      take: +limit,
      orderBy: { [sortBy]: sortOrder },
    });

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findProblemBySlug(slug: string) {
    const problem = await this.prisma.problem.findUnique({
      where: {
        problemSlug: slug,
      },
      select: {
        id: true,
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

  async createProblem(createProblemDto: CreateProblemDto) {
    const {
      title,
      problemId,
      frontendId,
      difficulty,
      problemSlug,
      description,
      topics,
      examples,
      constraints,
      hints,
      codeSnippets,
      testCases,
      solutions,
    } = createProblemDto;

    const problem = await this.prisma.problem.create({
      data: {
        title,
        problemId,
        frontendId,
        difficulty,
        problemSlug,
        description,
        solutions,
        topics: {
          create: topics.map((topic) => ({
            topic,
          })),
        },
        examples: {
          create:
            examples?.map((example) => ({
              exampleNum: example.example_num,
              inputText: example.example_text,
              outputText: example.example_text,
              orderIndex: example.example_num,
            })) || [],
        },
        constraints: {
          create:
            constraints?.map((constraint, index) => ({
              constraint,
              orderIndex: index,
            })) || [],
        },
        hints: {
          create:
            hints?.map((hint, index) => ({
              hintText: hint,
              orderIndex: index,
            })) || [],
        },
        testCases: {
          create: testCases.map((testCase, index) => ({
            input: testCase.input,
            expectedOutput: testCase.output,
            isPublic: true,
            orderIndex: index,
          })),
        },
        codeSnippets: codeSnippets || {},
      },
      include: {
        topics: true,
        examples: true,
        constraints: true,
        hints: true,
        testCases: true,
      },
    });

    await this.prisma.problemStats.create({
      data: {
        problemId: problem.id,
        totalSubmissions: 0,
        acceptedSubmissions: 0,
        acceptanceRate: 0,
      },
    });

    return problem;
  }

  async updateProblem(id: string, updateProblemDto: UpdateProblemDto) {
    const { topics, examples, constraints, hints, testCases, ...rest } =
      updateProblemDto;

    const problem = await this.prisma.problem.update({
      where: { id },
      data: {
        ...rest,
        ...(topics && {
          topics: {
            deleteMany: {},
            create: topics.map((topic) => ({ topic })),
          },
        }),
        ...(examples && {
          examples: {
            deleteMany: {},
            create: examples.map((example) => ({
              exampleNum: example.example_num,
              inputText: example.example_text,
              outputText: example.example_text,
              orderIndex: example.example_num,
            })),
          },
        }),
        ...(constraints && {
          constraints: {
            deleteMany: {},
            create: constraints.map((constraint, index) => ({
              constraint,
              orderIndex: index,
            })),
          },
        }),
        ...(hints && {
          hints: {
            deleteMany: {},
            create: hints.map((hint, index) => ({
              hintText: hint,
              orderIndex: index,
            })),
          },
        }),
        ...(testCases && {
          testCases: {
            deleteMany: {},
            create: testCases.map((testCase, index) => ({
              input: testCase.input,
              expectedOutput: testCase.output,
              isPublic: true,
              orderIndex: index,
            })),
          },
        }),
      },
      include: {
        topics: true,
        examples: true,
        constraints: true,
        hints: true,
        testCases: true,
      },
    });

    return problem;
  }

  async deleteProblem(id: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { id },
    });

    if (!problem) {
      throw new NotFoundException(`Problem with id "${id}" not found`);
    }

    const deletedProblem = await this.prisma.problem.delete({
      where: { id },
    });

    return deletedProblem;
  }

  async getProblemStats(slug: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { problemSlug: slug },
      select: { id: true },
    });

    if (!problem) {
      throw new NotFoundException(`Problem with slug "${slug}" not found`);
    }

    const stats = await this.prisma.problemStats.findUnique({
      where: { problemId: problem.id },
    });

    if (!stats) {
      throw new NotFoundException(`Stats not found for problem "${slug}"`);
    }

    return {
      totalSubmissions: stats.totalSubmissions,
      acceptedSubmissions: stats.acceptedSubmissions,
      acceptanceRate: stats.acceptanceRate,
      avgExecutionTime: stats.avgExecutionTime,
      avgMemoryUsed: stats.avgMemoryUsed,
      updatedAt: stats.updatedAt,
    };
  }

  //USER METHODS
  async getUserProgress(userId: string) {
    const userSubmissions = await this.prisma.userSubmission.findMany({
      where: { userId },
      include: {
        problem: {
          select: {
            id: true,
            title: true,
            problemSlug: true,
            difficulty: true,
          },
        },
        attempts: {
          select: {
            status: true,
            completedAt: true,
          },
          orderBy: { completedAt: 'desc' },
          take: 1,
        },
      },
    });

    const totalProblems = await this.prisma.problem.count({
      where: { isActive: true },
    });

    const solvedProblems = userSubmissions.filter(
      (sub) => sub.attempts[0]?.status === 'success',
    ).length;

    const attemptedProblems = userSubmissions.length;

    return {
      userId,
      totalProblems,
      solvedProblems,
      attemptedProblems,
      progressPercentage: (solvedProblems / totalProblems) * 100,
      submissions: userSubmissions.map((sub) => ({
        problemId: sub.problem.id,
        title: sub.problem.title,
        slug: sub.problem.problemSlug,
        difficulty: sub.problem.difficulty,
        status: sub.attempts[0]?.status || 'attempted',
        lastAttempt: sub.attempts[0]?.completedAt,
      })),
    };
  }

  async getUserProblemSubmissions(slug: string, userId: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { problemSlug: slug },
      select: { id: true },
    });

    if (!problem) {
      throw new NotFoundException(`Problem with slug "${slug}" not found`);
    }

    const userSubmission = await this.prisma.userSubmission.findUnique({
      where: {
        userId_problemId: {
          userId,
          problemId: problem.id,
        },
      },
      include: {
        attempts: {
          select: {
            id: true,
            attemptNumber: true,
            code: true,
            language: true,
            status: true,
            passedTests: true,
            failedTests: true,
            totalTests: true,
            executionTime: true,
            memoryUsed: true,
            errorMessage: true,
            createdAt: true,
            completedAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!userSubmission) {
      return {
        userId,
        problemSlug: slug,
        totalAttempts: 0,
        attempts: [],
        bestAttempt: null,
      };
    }

    const bestAttempt = userSubmission.attempts.find(
      (attempt) => attempt.status === 'success',
    );

    return {
      userId,
      problemSlug: slug,
      totalAttempts: userSubmission.attempts.length,
      status: userSubmission.status,
      currentLanguage: userSubmission.currentLanguage,
      attempts: userSubmission.attempts,
      bestAttempt: bestAttempt || null,
      lastSubmittedAt: userSubmission.submittedAt,
    };
  }
}
