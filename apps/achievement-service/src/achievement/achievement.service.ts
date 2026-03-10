import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginatedResult } from '@gitcode/types';
import { GetAchievementDto } from './dtos/get-achievement.dto';
import { SearchAchievementsDto } from './dtos/search-achievements.dto';
import { Prisma } from '@prisma/client-achievement';
import { GetAchievementProgressDto } from './dtos/get-achievement-progress.dto';
import { PatchAchievementDto } from './dtos/patch-achievement.dto';
import { PostAchievementDto } from './dtos/post-achievement.dto';
import { SubmissionCompletedEnvelope } from './events/envelopes';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { AchievementEventMapperService } from './achievement-event-mapper.service';
import { EventBus } from '@gitcode/messaging';
import { AI_PATTERNS, GenerateReadmeCommand } from '@gitcode/contracts';

@Injectable()
export class AchievementService {
  private readonly logger = new Logger(AchievementService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly achievementEventMapperService: AchievementEventMapperService,
    private readonly eventBus: EventBus,
  ) {}

  public async getAchievements(
    searchAchievementsDto: SearchAchievementsDto,
  ): Promise<PaginatedResult<GetAchievementDto>> {
    this.logger.log('Getting achievements');

    const skip = (searchAchievementsDto.page - 1) * searchAchievementsDto.limit;

    const where = this.buildAchievementWhereClause(searchAchievementsDto);

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
        code: achievement.code,
        name: achievement.name,
        description: achievement.description,
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

  public async getAchievedAchievements(
    userId: string,
    searchAchievementsDto: SearchAchievementsDto,
  ): Promise<PaginatedResult<GetAchievementDto>> {
    this.logger.log(`Getting achieved achievements for user ${userId}`);

    const skip = (searchAchievementsDto.page - 1) * searchAchievementsDto.limit;

    const where: Prisma.UserAchievementWhereInput =
      this.buildAchievementRelationWhereClause(searchAchievementsDto);
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
        code: userAchievement.achievement.code,
        name: userAchievement.achievement.name,
        description: userAchievement.achievement.description,
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
      this.buildAchievementRelationWhereClause(searchAchievementsDto);
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
        code: userProgress.achievement.code,
        name: userProgress.achievement.name,
        description: userProgress.achievement.description,
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

  public async createAchievement(
    postAchievementDto: PostAchievementDto,
  ): Promise<GetAchievementDto> {
    this.logger.log('Creating achievement');

    const achievement = await this.prismaService.achievement.create({
      data: {
        code: postAchievementDto.code,
        name: postAchievementDto.name,
        description: postAchievementDto.description,
        iconUrl: postAchievementDto.iconUrl,
        eventType: postAchievementDto.eventType,
        targetValue: postAchievementDto.targetValue,
      },
    });

    return {
      id: achievement.id,
      code: achievement.code,
      name: achievement.name,
      description: achievement.description,
      iconUrl: achievement.iconUrl,
      eventType: achievement.eventType,
      targetValue: achievement.targetValue,
    };
  }

  public async updateAchievement(
    id: string,
    patchAchievementDto: PatchAchievementDto,
  ): Promise<GetAchievementDto> {
    this.logger.log(`Updating achievement with id ${id}`);

    const achievement = await this.prismaService.achievement.update({
      where: { id },
      data: {
        name: patchAchievementDto.name,
        description: patchAchievementDto.description,
        iconUrl: patchAchievementDto.iconUrl,
        eventType: patchAchievementDto.eventType,
        targetValue: patchAchievementDto.targetValue,
      },
    });

    return {
      id: achievement.id,
      code: achievement.code,
      name: achievement.name,
      description: achievement.description,
      iconUrl: achievement.iconUrl,
      eventType: achievement.eventType,
      targetValue: achievement.targetValue,
    };
  }

  public async deleteAchievement(id: string): Promise<void> {
    this.logger.log(`Deleting achievement with id ${id}`);

    await this.prismaService.achievement.delete({
      where: { id },
    });
  }

  /**
   * Builds a where clause for filtering achievements based on achievement fields.
   * @param searchAchievementsDto - Search achievements dto
   * @returns - where clause
   */
  private buildAchievementWhereClause(
    searchAchievementsDto: SearchAchievementsDto,
  ): Prisma.AchievementWhereInput {
    const where: any = {};

    if (searchAchievementsDto.name) {
      where.name = {
        contains: searchAchievementsDto.name,
        mode: 'insensitive',
      };
    }

    if (searchAchievementsDto.description) {
      where.description = {
        contains: searchAchievementsDto.description,
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

  /**
   * Builds a where clause for filtering achievements based on related achievement fields.
   * @param searchAchievementsDto - Search achievements dto
   * @returns - where clause
   */
  private buildAchievementRelationWhereClause(
    searchAchievementsDto: SearchAchievementsDto,
  ): any {
    const achievementWhere: any = {};

    if (searchAchievementsDto.name) {
      achievementWhere.name = {
        contains: searchAchievementsDto.name,
        mode: 'insensitive',
      };
    }

    if (searchAchievementsDto.description) {
      achievementWhere.description = {
        contains: searchAchievementsDto.description,
        mode: 'insensitive',
      };
    }

    if (searchAchievementsDto.eventType) {
      achievementWhere.eventType = {
        contains: searchAchievementsDto.eventType,
        mode: 'insensitive',
      };
    }

    return Object.keys(achievementWhere).length > 0
      ? { achievement: achievementWhere }
      : {};
  }

  public async handleSubmissionCompletedEvent(
    envelope: SubmissionCompletedEnvelope,
  ): Promise<void> {
    this.logger.log(
      `Handling submission completed event for user ${envelope.payload.userId}`,
    );
    try {
      const { userId, language, problemId } = envelope.payload;

      const problemDetails = await this.fetchProblemDetails(problemId);

      const difficulty = problemDetails.difficulty;

      // Map the submission event to potential achievement events
      const eventTypes =
        this.achievementEventMapperService.getAllEventTypesForSubmission(
          language,
          difficulty,
        );

      await Promise.all(
        eventTypes.map((eventType) =>
          this.processAchievementEventType(userId, eventType),
        ),
      );

      this.logger.log(
        `Processed submission completed event for user ${userId} with event types: ${eventTypes.join(
          ', ',
        )}`,
      );
    } catch (error) {
      this.logger.error(
        `Error handling submission completed event for user ${envelope.payload.userId}`,
        error,
      );
      throw error;
    }
  }

  private async fetchProblemDetails(problemId: string): Promise<any> {
    try {
      this.logger.log(`Fetching problem details for problem ID: ${problemId}`);
      const response = await axios.get(
        `${this.configService.get('PROBLEM_SERVICE_URL')}/problems/internal/id/${problemId}`,
        {
          headers: {
            'x-internal-api-key': `${this.configService.get('INTERNAL_API_KEY')}`,
          },
        },
      );
      return response.data.data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch problem details for problem ${problemId}`,
        error,
      );
      throw new Error('Failed to fetch problem details');
    }
  }

  private async processAchievementEventType(
    userId: string,
    eventType: string,
  ): Promise<void> {
    await this.prismaService.$transaction(async (prisma) => {
      // Find all achievements matching this event type
      const achievements = await prisma.achievement.findMany({
        where: { eventType },
      });

      if (achievements.length === 0) {
        this.logger.log(
          `No achievements found for event type ${eventType}, skipping progress update for user ${userId}.`,
        );
        return;
      }

      const userProgressUpdates = await Promise.all(
        achievements.map((achievement) => {
          return prisma.userProgress.upsert({
            where: {
              userId_achievementId: {
                userId,
                achievementId: achievement.id,
              },
            },
            update: {
              currentProgress: {
                increment: 1,
              },
              updatedAt: new Date(),
            },
            create: {
              userId,
              achievementId: achievement.id,
              currentProgress: 1,
            },
            select: {
              achievementId: true,
              currentProgress: true,
              achievement: {
                select: {
                  targetValue: true,
                  code: true,
                  name: true,
                },
              },
            },
          });
        }),
      );

      const unlockedAchievements = [];

      userProgressUpdates.forEach((achievement) => {
        if (
          achievement.currentProgress >= achievement.achievement.targetValue
        ) {
          unlockedAchievements.push(achievement);
        }
      });

      if (unlockedAchievements.length > 0) {
        await prisma.userAchievement.createMany({
          data: unlockedAchievements.map((achievement) => ({
            userId,
            achievementId: achievement.achievementId,
          })),
          skipDuplicates: true,
        });

        this.logger.log(
          `User ${userId} unlocked achievements: ${unlockedAchievements
            .map((a) => a.achievement.code)
            .join(', ')}!`,
        );

        this.eventBus.publish(
          AI_PATTERNS.GENERATE_README,
          new GenerateReadmeCommand(userId),
        );
      }
    });
  }
}
