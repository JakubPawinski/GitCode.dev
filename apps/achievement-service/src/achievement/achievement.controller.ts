import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AchievementService } from './achievement.service';
import { SearchAchievementsDto } from './dtos/search-achievements.dto';
import { GetAchievementDto } from './dtos/get-achievement.dto';
import { PaginatedResult, AppPermission } from '@gitcode/types';
import { GetAchievementProgressDto } from './dtos/get-achievement-progress.dto';
import { PostAchievementDto } from './dtos/post-achievement.dto';
import { PatchAchievementDto } from './dtos/patch-achievement.dto';
import {
  JwtAuthGuard,
  PermissionsGuards,
  RequirePermissions,
} from '@gitcode/auth';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  ApiResponseDto,
  PaginatedResponseDto,
  ResponseInterceptor,
} from '@gitcode/common';

@Controller('achievements')
@UseInterceptors(ResponseInterceptor)
@ApiTags('Achievements')
@ApiExtraModels(
  GetAchievementDto,
  GetAchievementProgressDto,
  PaginatedResponseDto,
  ApiResponseDto,
)
export class AchievementController {
  constructor(private readonly achievementService: AchievementService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      $ref: getSchemaPath(ApiResponseDto),
    },
  })
  public healthCheck(): { status: string } {
    return this.achievementService.getHealth();
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuards)
  @RequirePermissions(AppPermission.ACHIEVEMENTS_VIEW)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Get a list of all achievements' })
  @ApiResponse({
    status: 200,
    description: 'List of achievements',
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(GetAchievementDto) },
            },
          },
        },
      ],
    },
  })
  public async getAchievements(
    @Query() searchAchievementsDto: SearchAchievementsDto,
  ): Promise<PaginatedResult<GetAchievementDto>> {
    return this.achievementService.getAchievements(searchAchievementsDto);
  }

  @Get('users/:userId')
  @UseGuards(JwtAuthGuard, PermissionsGuards)
  @RequirePermissions(AppPermission.ACHIEVEMENTS_VIEW)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({
    summary: 'Get a list of achievements earned by a specific user',
  })
  @ApiResponse({
    status: 200,
    description: 'List of user achievements',
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(GetAchievementDto) },
            },
          },
        },
      ],
    },
  })
  public async getUserAchievements(
    @Param('userId') userId: string,
    @Query() searchAchievementsDto: SearchAchievementsDto,
  ): Promise<PaginatedResult<GetAchievementDto>> {
    return this.achievementService.getAchievedAchievements(
      userId,
      searchAchievementsDto,
    );
  }

  @Get('users/:userId/progress')
  @UseGuards(JwtAuthGuard, PermissionsGuards)
  @RequirePermissions(AppPermission.ACHIEVEMENTS_VIEW)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({
    summary: 'Get the progress of a user towards earning achievements',
  })
  @ApiResponse({
    status: 200,
    description: 'User achievement progress',
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(GetAchievementProgressDto) },
            },
          },
        },
      ],
    },
  })
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
  @UseGuards(JwtAuthGuard, PermissionsGuards)
  @RequirePermissions(AppPermission.ACHIEVEMENTS_CREATE)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Create a new achievement' })
  @ApiResponse({
    status: 201,
    description: 'The achievement has been successfully created.',
    schema: {
      $ref: getSchemaPath(ApiResponseDto),
      properties: {
        data: { $ref: getSchemaPath(GetAchievementDto), type: 'object' },
      },
    },
  })
  public async createAchievement(
    @Body() postAchievementDto: PostAchievementDto,
  ): Promise<GetAchievementDto> {
    return this.achievementService.createAchievement(postAchievementDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuards)
  @RequirePermissions(AppPermission.ACHIEVEMENTS_UPDATE)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Update an existing achievement' })
  @ApiResponse({
    status: 200,
    description: 'The achievement has been successfully updated.',
    schema: {
      $ref: getSchemaPath(ApiResponseDto),
      properties: {
        data: { $ref: getSchemaPath(GetAchievementDto), type: 'object' },
      },
    },
  })
  public async updateAchievement(
    @Param('id') id: string,
    @Body() patchAchievementDto: PatchAchievementDto,
  ): Promise<GetAchievementDto> {
    return this.achievementService.updateAchievement(id, patchAchievementDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuards)
  @RequirePermissions(AppPermission.ACHIEVEMENTS_DELETE)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Delete an achievement' })
  @ApiResponse({
    status: 200,
    description: 'The achievement has been successfully deleted.',
    schema: {
      $ref: getSchemaPath(ApiResponseDto),
    },
  })
  public async deleteAchievement(@Param('id') id: string): Promise<void> {
    return this.achievementService.deleteAchievement(id);
  }
}
