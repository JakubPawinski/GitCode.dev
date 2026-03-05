import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AchievementService } from './achievement.service';
import { SearchAchievementsDto } from './dtos/search-achievements.dto';
import { GetAchievementDto } from './dtos/get-achievemeent.dto';
import { PaginatedResult } from '@gitcode/types';
import { GetAchievementProgressDto } from './dtos/get-achievement-progress.dto';
import { PostAchievementDto } from './dtos/post-achievement.dto';
import { PatchAchievementDto } from './dtos/patch-achievement.dto';

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
    return this.achievementService.getUserAchievementProgress(
      userId,
      searchAchievementsDto,
    );
  }

  // Admin endpoints

  @Post()
  public async createAchievement(
    @Body() postAchievementDto: PostAchievementDto,
  ): Promise<GetAchievementDto> {
    return this.achievementService.createAchievement(postAchievementDto);
  }

  @Patch(':id')
  public async updateAchievement(
    @Param('id') id: string,
    @Body() patchAchievementDto: PatchAchievementDto,
  ): Promise<GetAchievementDto> {
    return this.achievementService.updateAchievement(id, patchAchievementDto);
  }

  @Delete(':id')
  public async deleteAchievement(@Param('id') id: string): Promise<void> {
    return this.achievementService.deleteAchievement(id);
  }
}
