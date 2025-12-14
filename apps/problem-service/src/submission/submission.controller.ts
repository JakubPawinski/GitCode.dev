import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { SubmissionService } from './submission.service';
import {
  CreateSubmissionDto,
  CreateSubmissionResponseDto,
} from './dto/create-submission.dto';
import { JwtAuthGuard, User } from '@gitcode/auth';
import type { AuthenticatedUser } from '@gitcode/types';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  AttemptDetailsDto,
  DeleteResponseDto,
  RecentSubmissionDto,
  SubmissionDetailDto,
  SubmissionHistoryDto,
  SubmissionStatsDto,
} from './dto';
import { PaginationQueryDto } from '@gitcode/common';
import { PaginatedResult } from '@gitcode/types';

@Controller('submissions')
export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createSubmissionDto: CreateSubmissionDto,
    @User() user: AuthenticatedUser,
  ): Promise<CreateSubmissionResponseDto> {
    const userId = user.id;
    return this.submissionService.create(createSubmissionDto, userId);
  }

  @Get('user/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user submission history' })
  @ApiResponse({
    status: 200,
    description: 'All submissions for current user',
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
  async getAttemptDetails(
    @Param('attemptId') attemptId: string,
  ): Promise<AttemptDetailsDto> {
    return this.submissionService.getAttemptDetails(attemptId);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user submission statistics' })
  @ApiResponse({
    status: 200,
    description: 'User submission stats (total, solved, acceptance rate)',
    type: SubmissionStatsDto,
  })
  getUserStats(@User() user: AuthenticatedUser): Promise<SubmissionStatsDto> {
    const userId = user.id;
    return this.submissionService.getUserStats(userId);
  }

  @Get('recent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get recent submissions (last N)' })
  @ApiResponse({
    status: 200,
    description: 'Recent user submissions',
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get submission details by ID' })
  @ApiResponse({
    status: 200,
    description: 'Full submission details with all attempts',
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a submission' })
  @ApiResponse({
    status: 200,
    description: 'Submission deleted successfully',
  })
  deleteSubmission(
    @Param('submissionId') submissionId: string,
    @User() user: AuthenticatedUser,
  ): Promise<DeleteResponseDto> {
    const userId = user.id;
    return this.submissionService.deleteSubmission(submissionId, userId);
  }
}
