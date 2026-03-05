import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginatedResult } from '@gitcode/types';
import { GetAchievementDto } from './dtos/get-achievemeent.dto';
import { SearchAchievementsDto } from './dtos/search-achievements.dto';
import { Prisma } from '@prisma/client-achievement';
import { GetAchievementProgressDto } from './dtos/get-achievement-progress.dto';

@Injectable()
export class AchievementService {
  private readonly logger = new Logger(AchievementService.name);

  constructor(private readonly prismaService: PrismaService) {}

  public async getAchievements(
    searchAchievementsDto: SearchAchievementsDto,
  ): Promise<PaginatedResult<GetAchievementDto>> {
    this.logger.log('Getting achievements');

    const skip = (searchAchievementsDto.page - 1) * searchAchievementsDto.limit;

    const where = this.buildWhereClause<Prisma.AchievementWhereInput>(
      searchAchievementsDto,
    );

    const [achievements, total] = await this.prismaService.$transaction([
      this.prismaService.achievement.findMany({
        where,
        skip,
        take: searchAchievementsDto.limit,
        orderBy: {
          [searchAchievementsDto.sortBy]: searchAchievementsDto.sortOrder,
        },
      }),
      this.prismaService.achievement.count({ where }),
    ]);

    const totalPages = Math.ceil(total / searchAchievementsDto.limit);

    return {
      data: achievements.map((achievement) => ({
        id: achievement.id,
        name: achievement.name,
        describtion: achievement.description,
        iconUrl: achievement.iconUrl,
        eventType: achievement.eventType,
        targetValue: achievement.targetValue,
      })),
      meta: {
        totalItems: total,
        totalPages,
        currentPage: searchAchievementsDto.page,
        pageSize: searchAchievementsDto.limit,
        hasNextPage: searchAchievementsDto.page < totalPages,
        hasPreviousPage: searchAchievementsDto.page > 1,
      },
    };
  }

  public async getAchievedAchievemnts(
    userId: string,
    searchAchievementsDto: SearchAchievementsDto,
  ): Promise<PaginatedResult<GetAchievementDto>> {
    this.logger.log(`Getting achieved achievements for user ${userId}`);

    const skip = (searchAchievementsDto.page - 1) * searchAchievementsDto.limit;

    const where: Prisma.UserAchievementWhereInput =
      this.buildWhereClause<Prisma.UserAchievementWhereInput>(
        searchAchievementsDto,
      );
    where.userId = userId;

    const [userAchievements, total] = await this.prismaService.$transaction([
      this.prismaService.userAchievement.findMany({
        where,
        skip,
        take: searchAchievementsDto.limit,
        orderBy: {
          achievement: {
            [searchAchievementsDto.sortBy]: searchAchievementsDto.sortOrder,
          },
        },
        include: {
          achievement: true,
        },
      }),
      this.prismaService.userAchievement.count({ where }),
    ]);

    const totalPages = Math.ceil(total / searchAchievementsDto.limit);

    return {
      data: userAchievements.map((userAchievement) => ({
        id: userAchievement.achievement.id,
        name: userAchievement.achievement.name,
        describtion: userAchievement.achievement.description,
        iconUrl: userAchievement.achievement.iconUrl,
        eventType: userAchievement.achievement.eventType,
        targetValue: userAchievement.achievement.targetValue,
      })),
      meta: {
        totalItems: total,
        totalPages,
        currentPage: searchAchievementsDto.page,
        pageSize: searchAchievementsDto.limit,
        hasNextPage: searchAchievementsDto.page < totalPages,
        hasPreviousPage: searchAchievementsDto.page > 1,
      },
    };
  }

  public async getUserAchievementProgress(
    userId: string,
    searchAchievementsDto: SearchAchievementsDto,
  ): Promise<PaginatedResult<GetAchievementProgressDto>> {
    this.logger.log(`Getting achievement progress for user ${userId}`);

    const skip = (searchAchievementsDto.page - 1) * searchAchievementsDto.limit;

    const where: Prisma.UserProgressWhereInput =
      this.buildWhereClause<Prisma.UserProgressWhereInput>(
        searchAchievementsDto,
      );
    where.userId = userId;

    const [userProgress, total] = await this.prismaService.$transaction([
      this.prismaService.userProgress.findMany({
        where,
        skip,
        take: searchAchievementsDto.limit,
        include: {
          achievement: true,
        },
      }),
      this.prismaService.userProgress.count({ where }),
    ]);

    const totalPages = Math.ceil(total / searchAchievementsDto.limit);

    return {
      data: userProgress.map((userProgress) => ({
        id: userProgress.achievement.id,
        name: userProgress.achievement.name,
        describtion: userProgress.achievement.description,
        iconUrl: userProgress.achievement.iconUrl,
        eventType: userProgress.achievement.eventType,
        targetValue: userProgress.achievement.targetValue,
        progress: userProgress.currentProgress,
      })),
      meta: {
        totalItems: total,
        totalPages,
        currentPage: searchAchievementsDto.page,
        pageSize: searchAchievementsDto.limit,
        hasNextPage: searchAchievementsDto.page < totalPages,
        hasPreviousPage: searchAchievementsDto.page > 1,
      },
    };
  }

  /**
   * Builds a Prisma where clause based on the provided search criteria.
   * @param searchAchievementsDto - The search criteria for filtering achievements.
   * @returns - A Prisma where clause object that can be used in database queries.
   */
  private buildWhereClause<T>(searchAchievementsDto: SearchAchievementsDto): T {
    const where: any = {};

    if (searchAchievementsDto.name) {
      where.name = {
        contains: searchAchievementsDto.name,
        mode: 'insensitive',
      };
    }

    if (searchAchievementsDto.describtion) {
      where.description = {
        contains: searchAchievementsDto.describtion,
        mode: 'insensitive',
      };
    }

    if (searchAchievementsDto.eventType) {
      where.eventType = {
        contains: searchAchievementsDto.eventType,
        mode: 'insensitive',
      };
    }

    return where;
  }
}
