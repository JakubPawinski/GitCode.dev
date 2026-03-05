import { Controller, Get, Param, Query } from '@nestjs/common';
import { AchievementService } from './achievement.service';
import { SearchAchievementsDto } from './dtos/search-achievements.dto';
import { GetAchievementDto } from './dtos/get-achievemeent.dto';
import { PaginatedResult } from '@gitcode/types';
import { GetAchievementProgressDto } from './dtos/get-achievement-progress.dto';

@Controller('achievements')
export class AchievementController {
  constructor(private readonly achievementService: AchievementService) {}

  @Get()
  public async getAchievements(
    @Query() searchAchievementsDto: SearchAchievementsDto,
  ): Promise<PaginatedResult<GetAchievementDto>> {
    return this.achievementService.getAchievements(searchAchievementsDto);
  }

  @Get('users/:userId')
  public async getUserAchievements(
    @Param('userId') userId: string,
    @Query() searchAchievementsDto: SearchAchievementsDto,
  ): Promise<PaginatedResult<GetAchievementDto>> {
    return this.achievementService.getAchievedAchievemnts(
      userId,
      searchAchievementsDto,
    );
  }

  @Get('users/:userId/progress')
  public async getUserAchievementProgress(
    @Param('userId') userId: string,
    @Query() searchAchievementsDto: SearchAchievementsDto,
  ): Promise<PaginatedResult<GetAchievementProgressDto>> {
    return this.achievementService.getUserAchievementProgress(userId, searchAchievementsDto);
  }
}
