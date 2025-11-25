import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { SubmissionService } from './submission.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  PaginatedResponseDto,
  PaginatedResult,
  PaginationDto,
} from 'src/problem/dto';
import { SubmissionHistoryDto } from './dto';

@Controller('submissions')
export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createSubmissionDto: CreateSubmissionDto, @Req() req) {
    const userId = req.user.id;
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
    @Req() req,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResult<SubmissionHistoryDto>> {
    const userId = req.user.id;
    return this.submissionService.getUserSubmissionHistory(
      userId,
      paginationDto,
    );
  }
  @Get('attempts/:attemptId')
  @UseGuards(JwtAuthGuard)
  async getAttemptDetails(@Param('attemptId') attemptId: string) {
    return this.submissionService.getAttemptDetails(attemptId);
  }
}
