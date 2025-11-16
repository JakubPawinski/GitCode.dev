import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  PaginatedResponseDto,
  PaginatedResult,
  PaginationDto,
} from './dto/pagination.dto';
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
