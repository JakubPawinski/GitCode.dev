import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { SubmissionService } from './submission.service';
import {
  CreateSubmissionDto,
  CreateSubmissionResponseDto,
} from './dto/create-submission.dto';
import { InternalService, JwtAuthGuard, User } from '@gitcode/auth';
import type { AuthenticatedUser } from '@gitcode/types';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  AttemptDetailsDto,
  DeleteResponseDto,
  RecentSubmissionDto,
  SubmissionDetailDto,
  SubmissionHistoryDto,
  SubmissionStatsDto,
} from './dto';
import { UserStatsExtendedDto } from './dto/user-stats-extended.dto';
import {
  ApiResponseDto,
  PaginatedResponseDto,
  PaginationQueryDto,
} from '@gitcode/common';
import { PaginatedResult } from '@gitcode/types';

@Controller('submissions')
@ApiExtraModels(
  CreateSubmissionResponseDto,
  SubmissionHistoryDto,
  AttemptDetailsDto,
  SubmissionStatsDto,
  RecentSubmissionDto,
  SubmissionDetailDto,
  ApiResponseDto,
  PaginatedResponseDto,
  DeleteResponseDto,
)
export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Create a new submission' })
  @ApiResponse({
    status: 201,
    description: 'Submission created successfully',
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(ApiResponseDto),
        },
        {
          properties: {
            data: {
              $ref: getSchemaPath(CreateSubmissionResponseDto),
              type: 'object',
            },
          },
        },
      ],
    },
  })
  create(
    @Body() createSubmissionDto: CreateSubmissionDto,
    @User() user: AuthenticatedUser,
  ): Promise<CreateSubmissionResponseDto> {
    const userId = user.id;
    return this.submissionService.create(createSubmissionDto, userId);
  }

  @Get('user/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Get user submission history' })
  @ApiResponse({
    status: 200,
    description: 'All submissions for current user',
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(PaginatedResponseDto),
        },
        {
          properties: {
            data: {
              $ref: getSchemaPath(SubmissionHistoryDto),
              type: 'array',
            },
          },
        },
      ],
    },
  })
  getUserHistory(
    @User() user: AuthenticatedUser,
    @Query() paginationDto: PaginationQueryDto,
  ): Promise<PaginatedResult<SubmissionHistoryDto>> {
    const userId = user.id;
    return this.submissionService.getUserSubmissionHistory(
      userId,
      paginationDto,
    );
  }

  @Get('attempts/:attemptId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Get details of a specific submission attempt' })
  @ApiResponse({
    status: 200,
    description: 'Details of the submission attempt',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(AttemptDetailsDto),
              type: 'object',
            },
          },
        },
      ],
    },
  })
  async getAttemptDetails(
    @Param('attemptId') attemptId: string,
  ): Promise<AttemptDetailsDto> {
    return this.submissionService.getAttemptDetails(attemptId);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Get user submission statistics' })
  @ApiResponse({
    status: 200,
    description: 'User submission stats (total, solved, acceptance rate)',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(SubmissionStatsDto),
              type: 'object',
            },
          },
        },
      ],
    },
  })
  getUserStats(@User() user: AuthenticatedUser): Promise<SubmissionStatsDto> {
    const userId = user.id;
    return this.submissionService.getUserStats(userId);
  }

  /**
   * Get extended user statistics for README generation and charts
   * @param userId - ID of the user
   * @returns - Extended user statistics with all metrics
   */
  @Get('stats/extended/:userId')
  @ApiBearerAuth('Bearer Auth')
  @InternalService()
  @ApiOperation({
    summary: 'Get extended user statistics for README generation and charts',
  })
  @ApiResponse({
    status: 200,
    description: 'Extended user statistics with all metrics',
    type: UserStatsExtendedDto,
  })
  getUserStatsExtended(
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ): Promise<UserStatsExtendedDto> {
    return this.submissionService.getUserStatsExtended(userId);
  }

  @Get('recent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Get recent submissions (last N)' })
  @ApiResponse({
    status: 200,
    description: 'Recent user submissions',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(RecentSubmissionDto) },
            },
          },
        },
      ],
    },
  })
  getRecentSubmissions(
    @User() user: AuthenticatedUser,
    @Query('limit') limit: number = 10,
  ): Promise<RecentSubmissionDto[]> {
    const userId = user.id;
    return this.submissionService.getRecentSubmissions(userId, limit);
  }

  @Get(':submissionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Get submission details by ID' })
  @ApiResponse({
    status: 200,
    description: 'Full submission details with all attempts',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(SubmissionDetailDto),
              type: 'object',
            },
          },
        },
      ],
    },
  })
  getSubmissionById(
    @Param('submissionId') submissionId: string,
    @User() user: AuthenticatedUser,
  ): Promise<SubmissionDetailDto> {
    const userId = user.id;
    return this.submissionService.getSubmissionById(submissionId, userId);
  }

  @Delete(':submissionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Delete a submission' })
  @ApiResponse({
    status: 200,
    description: 'Submission deleted successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(DeleteResponseDto),
              type: 'object',
            },
          },
        },
      ],
    },
  })
  deleteSubmission(
    @Param('submissionId') submissionId: string,
    @User() user: AuthenticatedUser,
  ): Promise<DeleteResponseDto> {
    const userId = user.id;
    return this.submissionService.deleteSubmission(submissionId, userId);
  }
}
