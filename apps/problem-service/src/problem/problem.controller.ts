import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Patch,
  Delete,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { ProblemService } from './problem.service';
import { JwtAuthGuard, User } from '@gitcode/auth';
import type { AuthenticatedUser } from '@gitcode/types';
import {
  ProblemResponseDto,
  ProblemDetailResponseDto,
  ProblemStatsResponseDto,
  UserProgressResponseDto,
  TrendingResponseDto,
  RecommendedResponseDto,
  UserSubmissionDto,
  CreateProblemDto,
  UpdateProblemDto,
  ProblemPaginationQueryDto,
} from './dto';

import { PaginatedResult } from '@gitcode/types';
import { ApiResponseDto, PaginatedResponseDto } from '@gitcode/common';

@ApiTags('Problems')
@Controller('problems')
@ApiExtraModels(
  ProblemResponseDto,
  ProblemDetailResponseDto,
  ProblemStatsResponseDto,
  UserProgressResponseDto,
  TrendingResponseDto,
  RecommendedResponseDto,
  UserSubmissionDto,
  PaginatedResponseDto,
  ApiResponseDto,
)
export class ProblemController {
  constructor(private readonly problemService: ProblemService) {}

  @Get('health')
  @ApiOperation({ summary: 'Get Problem Service status' })
  public getHealth() {
    return this.problemService.getHealth();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Get paginated problems list' })
  @ApiResponse({
    status: 200,
    description: 'List of problems with pagination',
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(ProblemResponseDto),
              type: 'array',
            },
          },
        },
      ],
    },
  })
  findAll(
    @Query() paginationDto: ProblemPaginationQueryDto,
  ): Promise<PaginatedResult<ProblemResponseDto>> {
    return this.problemService.getPaginatedProblems(paginationDto);
  }

  @Get('user/progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Get user progress on problems' })
  @ApiResponse({
    status: 200,
    description: 'User progress statistics',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(UserProgressResponseDto),
            },
          },
        },
      ],
    },
  })
  getUserProgress(
    @User() user: AuthenticatedUser,
  ): Promise<UserProgressResponseDto> {
    const userId = user.id;
    return this.problemService.getUserProgress(userId);
  }

  @Get('recommendations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Get recommended problems for user' })
  @ApiResponse({
    status: 200,
    description: 'Recommended problems based on user topics',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(RecommendedResponseDto),
            },
          },
        },
      ],
    },
  })
  getRecommendedProblems(
    @User() user: AuthenticatedUser,
  ): Promise<RecommendedResponseDto> {
    const userId = user.id;
    return this.problemService.getRecommended(userId);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Search problems by query' })
  @ApiResponse({
    status: 200,
    description: 'Search results with pagination',
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(ProblemResponseDto),
              type: 'array',
            },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Search query cannot be empty',
  })
  search(
    @Query('q') query: string,
    @Query() paginationDto: ProblemPaginationQueryDto,
  ): Promise<PaginatedResult<ProblemResponseDto>> {
    return this.problemService.searchProblems(query, paginationDto);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending problems' })
  @ApiResponse({
    status: 200,
    description: 'Top 10 trending problems',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(TrendingResponseDto),
            },
          },
        },
      ],
    },
  })
  getTrending(): Promise<TrendingResponseDto> {
    return this.problemService.getTrending();
  }

  @Get(':slug')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Get problem details by slug' })
  @ApiResponse({
    status: 200,
    description: 'Detailed problem information',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(ProblemDetailResponseDto),
            },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Problem not found',
  })
  findOne(@Param('slug') slug: string): Promise<ProblemDetailResponseDto> {
    return this.problemService.findProblemBySlug(slug);
  }

  @Get(':slug/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Get problem statistics' })
  @ApiResponse({
    status: 200,
    description: 'Problem submission and performance stats',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(ProblemStatsResponseDto),
            },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Problem not found',
  })
  getStats(@Param('slug') slug: string): Promise<ProblemStatsResponseDto> {
    return this.problemService.getProblemStats(slug);
  }

  @Get(':slug/submissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Get user submissions for a problem' })
  @ApiResponse({
    status: 200,
    description: 'User submission history for problem',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(UserSubmissionDto),
            },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Problem not found',
  })
  getUserProblemSubmissions(
    @Param('slug') slug: string,
    @User() user: AuthenticatedUser,
  ): Promise<UserSubmissionDto> {
    const userId = user.id;
    return this.problemService.getUserProblemSubmissions(slug, userId);
  }
  //ADMIN ENDPOINTS
  //TODO MAKE SURE USER HAS ROLE ADMIN
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Create new problem (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Problem created successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(ProblemDetailResponseDto),
            },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  create(
    @Body() createProblemDto: CreateProblemDto,
  ): Promise<ProblemDetailResponseDto> {
    return this.problemService.createProblem(createProblemDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Update problem (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Problem updated successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(ProblemDetailResponseDto),
            },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Problem not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  update(
    @Param('id') id: string,
    @Body() updateProblemDto: UpdateProblemDto,
  ): Promise<ProblemDetailResponseDto> {
    return this.problemService.updateProblem(id, updateProblemDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Delete problem (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Problem deleted successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Problem deleted successfully',
                },
                deletedId: {
                  type: 'string',
                  example: '123e4567-e89b-12d3-a456-426614174000',
                },
              },
            },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Problem not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  delete(@Param('id') id: string) {
    return this.problemService.deleteProblem(id);
  }
}
