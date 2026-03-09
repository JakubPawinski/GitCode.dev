import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProblemDto,
  UpdateProblemDto,
  ProblemResponseDto,
  ProblemDetailResponseDto,
  ProblemStatsResponseDto,
  TrendingResponseDto,
  UserProgressResponseDto,
  UserSubmissionDto,
  RecommendedResponseDto,
  ProblemPaginationQueryDto,
} from './dto';
import { PaginatedResult } from '@gitcode/types';
import { CodeSnippet } from '@prisma/client-problem';

@Injectable()
export class ProblemService {
  private readonly logger = new Logger(ProblemService.name);
  constructor(private prisma: PrismaService) {}
  getHealth() {
    return { status: 'Problem Service is healthy' };
  }

  /**
   * Get a paginated list of problems based on the provided pagination parameters.
   * @param paginationDto - Pagination parameters including page, limit, sortBy, sortOrder, and filters.
   * @returns - A paginated list of problems.
   */
  public async getPaginatedProblems(
    paginationDto: ProblemPaginationQueryDto,
  ): Promise<PaginatedResult<ProblemResponseDto>> {
    this.logger.log(
      `Fetching paginated problems with params: ${JSON.stringify(paginationDto)}`,
    );

    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || 10;
    const sortBy = paginationDto.sortBy || 'createdAt';
    const sortOrder = paginationDto.sortOrder || 'desc';

    // Build the where clause based on filters
    const { difficulty, topic, search } = paginationDto;

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
    if (search) {
      const trimmedSearch = search.trim();
      where.OR = [
        {
          title: {
            contains: trimmedSearch,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: trimmedSearch,
            mode: 'insensitive',
          },
        },
      ];
    }
    this.logger.debug(`Constructed where clause: ${JSON.stringify(where)}`);

    // Get total count for pagination
    const total = await this.prisma.problem.count({ where });
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    // Fetch paginated data
    const data = await this.prisma.problem.findMany({
      where,
      skip,
      take: +limit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        problemId: true,
        title: true,
        difficulty: true,
        problemSlug: true,
        description: true,
        topics: {
          select: {
            topic: true,
          },
        },
        similarProblems: {
          select: {
            problemTo: {
              select: {
                title: true,
                problemSlug: true,
                difficulty: true,
              },
            },
          },
        },
      },
    });

    const mappedData: ProblemResponseDto[] = data.map((problem) => ({
      id: problem.id,
      problemId: problem.problemId,
      title: problem.title,
      difficulty: problem.difficulty,
      problemSlug: problem.problemSlug,
      description: problem.description,
      topics: problem.topics.map((t) => t.topic),
      similarProblems: problem.similarProblems.map((p) => p.problemTo),
    }));

    return {
      data: mappedData,
      meta: {
        currentPage: page,
        pageSize: limit,
        totalItems: total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findProblemBySlug(slug: string): Promise<ProblemDetailResponseDto> {
    const problem = await this.findProblemWithDetails({ problemSlug: slug });

    if (!problem) {
      throw new NotFoundException(`Problem with slug "${slug}" not found`);
    }

    const mapped: ProblemDetailResponseDto = {
      id: problem.id,
      problemId: problem.problemId,
      title: problem.title,
      difficulty: problem.difficulty,
      problemSlug: problem.problemSlug,
      description: problem.description,
      codeSnippets: this.mapCodeSnippets(problem.codeSnippets),
      topics: problem.topics.map((t) => t.topic),
      examples: problem.examples.map((e) => ({
        inputText: e.inputText,
        outputText: e.outputText,
      })),
      constraints: problem.constraints.map((c) => c.constraint),
      hints: problem.hints.map((h) => ({
        hintText: h.hintText,
        orderIndex: h.orderIndex,
      })),
      testCases: problem.testCases.map((t) => ({
        input: t.input,
        expectedOutput: t.expectedOutput,
      })),
      similarProblems: problem.similarProblems.map((p) => p.problemTo),
    };

    return mapped;
  }

  private async findProblemWithDetails(
    where: any,
  ): Promise<any> {
    return await this.prisma.problem.findUnique({
      where,
      select: {
        id: true,
        problemId: true,
        title: true,
        difficulty: true,
        problemSlug: true,
        description: true,
        codeSnippets: true,
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
  }

  /**
   * Get problem details by its unique ID.
   * @param id - The unique identifier of the problem.
   * @returns - Detailed information about the problem.
   */
  public async findProblemById(id: string): Promise<ProblemDetailResponseDto> {
    const problem = await this.findProblemWithDetails({ id });

    if (!problem) {
      throw new NotFoundException(`Problem with id "${id}" not found`);
    }

    const mapped: ProblemDetailResponseDto = {
      id: problem.id,
      problemId: problem.problemId,
      title: problem.title,
      difficulty: problem.difficulty,
      problemSlug: problem.problemSlug,
      description: problem.description,
      codeSnippets: this.mapCodeSnippets(problem.codeSnippets),
      topics: problem.topics.map((t) => t.topic),
      examples: problem.examples.map((e) => ({
        inputText: e.inputText,
        outputText: e.outputText,
      })),
      constraints: problem.constraints.map((c) => c.constraint),
      hints: problem.hints.map((h) => ({
        hintText: h.hintText,
        orderIndex: h.orderIndex,
      })),
      testCases: problem.testCases.map((t) => ({
        input: t.input,
        expectedOutput: t.expectedOutput,
      })),
      similarProblems: problem.similarProblems.map((p) => p.problemTo),
    };
    return mapped;
  }

  async createProblem(
    createProblemDto: CreateProblemDto,
  ): Promise<ProblemDetailResponseDto> {
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
        codeSnippets: true,
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

    await this.prisma.problemStats.create({
      data: {
        problemId: problem.id,
        totalSubmissions: 0,
        acceptedSubmissions: 0,
        acceptanceRate: 0,
      },
    });

    const mapped: ProblemDetailResponseDto = {
      id: problem.id,
      problemId: problem.problemId,
      title: problem.title,
      difficulty: problem.difficulty,
      problemSlug: problem.problemSlug,
      description: problem.description,
      topics: problem.topics.map((t) => t.topic),
      examples: problem.examples.map((e) => ({
        inputText: e.inputText,
        outputText: e.outputText,
      })),
      constraints: problem.constraints.map((c) => c.constraint),
      hints: problem.hints.map((h) => ({
        hintText: h.hintText,
        orderIndex: h.orderIndex,
      })),
      testCases: problem.testCases.map((t) => ({
        input: t.input,
        expectedOutput: t.expectedOutput,
      })),
      codeSnippets: this.mapCodeSnippets(problem.codeSnippets),
      similarProblems: problem.similarProblems.map((p) => p.problemTo),
    };

    return mapped;
  }

  async updateProblem(
    id: string,
    updateProblemDto: UpdateProblemDto,
  ): Promise<ProblemDetailResponseDto> {
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
        codeSnippets: true,
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

    const mapped: ProblemDetailResponseDto = {
      id: problem.id,
      problemId: problem.problemId,
      title: problem.title,
      difficulty: problem.difficulty,
      problemSlug: problem.problemSlug,
      description: problem.description,
      topics: problem.topics.map((t) => t.topic),
      examples: problem.examples.map((e) => ({
        inputText: e.inputText,
        outputText: e.outputText,
      })),
      constraints: problem.constraints.map((c) => c.constraint),
      hints: problem.hints.map((h) => ({
        hintText: h.hintText,
        orderIndex: h.orderIndex,
      })),
      testCases: problem.testCases.map((t) => ({
        input: t.input,
        expectedOutput: t.expectedOutput,
      })),
      codeSnippets: this.mapCodeSnippets(problem.codeSnippets),
      similarProblems: problem.similarProblems.map((p) => p.problemTo),
    };

    return mapped;
  }

  async deleteProblem(id: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { id },
    });

    if (!problem) {
      throw new NotFoundException(`Problem with id "${id}" not found`);
    }

    await this.prisma.problem.delete({
      where: { id },
    });

    return {
      message: 'Problem deleted successfully',
      deletedId: id,
    };
  }

  async getProblemStats(slug: string): Promise<ProblemStatsResponseDto> {
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
      return null;
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

  async getTrending(): Promise<TrendingResponseDto> {
    // Get all problems
    const trendingProblems = await this.prisma.problem.findMany({
      select: {
        id: true,
        problemId: true,
        title: true,
        problemSlug: true,
        difficulty: true,
        description: true,
        problemStats: {
          select: {
            totalSubmissions: true,
            acceptedSubmissions: true,
            acceptanceRate: true,
          },
        },
        topics: {
          select: {
            topic: true,
          },
        },
        similarProblems: {
          select: {
            problemTo: {
              select: {
                title: true,
                problemSlug: true,
                difficulty: true,
              },
            },
          },
        },
      },
    });
    // Sort by most submissions
    const sorted = trendingProblems.sort(
      (a, b) =>
        (b.problemStats[0]?.totalSubmissions || 0) -
        (a.problemStats[0]?.totalSubmissions || 0),
    );

    return {
      // Return top 10
      trendingCount: sorted.slice(0, 10).length,
      trending: sorted.slice(0, 10).map((problem) => ({
        id: problem.id,
        problemId: problem.problemId,
        title: problem.title,
        problemSlug: problem.problemSlug,
        difficulty: problem.difficulty,
        description: problem.description,
        topics: problem.topics.map((t) => t.topic),
        similarProblems: problem.similarProblems.map((p) => p.problemTo),
        totalSubmissions: problem.problemStats[0]?.totalSubmissions || 0,
        acceptanceRate: problem.problemStats[0]?.acceptanceRate || 0,
      })),
    };
  }
  //USER METHODS
  async getUserProgress(userId: string): Promise<UserProgressResponseDto> {
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

    const solvedProblems = userSubmissions.filter((sub) => sub.isSolved).length;

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

  async getUserProblemSubmissions(
    slug: string,
    userId: string,
  ): Promise<UserSubmissionDto> {
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
        isSolved: false,
        currentLanguage: 'python',
        attempts: [],
        bestAttempt: null,
        lastSubmittedAt: null,
      };
    }

    const bestAttempt = userSubmission.attempts
      .filter((attempt) => attempt.status === 'success')
      .sort((a, b) => (a.executionTime || 0) - (b.executionTime || 0))[0];

    return {
      userId,
      problemSlug: slug,
      totalAttempts: userSubmission.attempts.length,
      isSolved: userSubmission.isSolved,
      currentLanguage: userSubmission.currentLanguage,
      attempts: userSubmission.attempts.map((a) => ({
        id: a.id,
        status: a.status,
        code: a.code,
        language: a.language,
        executionTime: a.executionTime,
        memoryUsed: a.memoryUsed,
        submittedAt: a.createdAt,
      })),
      bestAttempt: bestAttempt
        ? {
            id: bestAttempt.id,
            status: bestAttempt.status,
            code: bestAttempt.code,
            language: bestAttempt.language,
            executionTime: bestAttempt.executionTime,
            memoryUsed: bestAttempt.memoryUsed,
            submittedAt: bestAttempt.createdAt,
          }
        : null,
      lastSubmittedAt: userSubmission.submittedAt,
    };
  }

  async getRecommended(userId: string): Promise<RecommendedResponseDto> {
    const solvedProblems = await this.prisma.userSubmission.findMany({
      where: {
        userId,
        isSolved: true,
      },
      select: {
        problemId: true,
      },
    });

    const solvedProblemIds = solvedProblems.map((sub) => sub.problemId);

    const userTopics = await this.prisma.problemTopic.findMany({
      where: {
        problemId: {
          in: solvedProblemIds,
        },
      },
      distinct: ['topic'],
      select: {
        topic: true,
      },
    });

    const userTopicList = userTopics.map((t) => t.topic);

    const recommendedProblems = await this.prisma.problem.findMany({
      where: {
        id: {
          notIn: solvedProblemIds,
        },
        topics: {
          some: {
            topic: {
              in: userTopicList,
            },
          },
        },
      },
      select: {
        id: true,
        problemId: true,
        title: true,
        problemSlug: true,
        difficulty: true,
        description: true,
        topics: {
          select: {
            topic: true,
          },
        },
        similarProblems: {
          select: {
            problemTo: {
              select: {
                title: true,
                problemSlug: true,
                difficulty: true,
              },
            },
          },
        },
      },
      take: 10,
      orderBy: {
        difficulty: 'asc',
      },
    });

    return {
      userId,
      recommendedCount: recommendedProblems.length,
      recommendations: recommendedProblems.map((problem) => ({
        id: problem.id,
        problemId: problem.problemId,
        title: problem.title,
        problemSlug: problem.problemSlug,
        difficulty: problem.difficulty,
        description: problem.description,
        topics: problem.topics.map((t) => t.topic),
        similarProblems: problem.similarProblems.map((p) => p.problemTo),
      })),
    };
  }
  private mapCodeSnippets(
    codeSnippets: CodeSnippet[] | null,
  ): Record<string, string> {
    return codeSnippets
      ? codeSnippets.reduce(
          (acc, snippet) => {
            acc[snippet.language] = snippet.starterCode;
            return acc;
          },
          {} as Record<string, string>,
        )
      : {};
  }
}
