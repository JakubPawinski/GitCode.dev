import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Query,
  Req,
  UseGuards,
  Patch,
  Delete,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProblemService } from './problem.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import {
  PaginatedResult,
  PaginationDto,
  ProblemResponseDto,
  ProblemDetailResponseDto,
  ProblemStatsResponseDto,
  UserProgressResponseDto,
  TrendingResponseDto,
  RecommendedResponseDto,
  UserSubmissionDto,
  CreateProblemDto,
  UpdateProblemDto,
} from './dto';

@ApiTags('Problems')
@Controller('problems')
export class ProblemController {
  constructor(private readonly problemService: ProblemService) {}

  @Get('health')
  @ApiOperation({ summary: 'Get Auth Service status' })
  public getHealth() {
    return this.appService.getHealth();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated problems list' })
  @ApiResponse({
    status: 200,
    description: 'List of problems with pagination',
    type: ProblemResponseDto,
    isArray: true,
  })
  findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResult<ProblemResponseDto>> {
    return this.problemService.getPaginatedProblems(paginationDto);
  }

  @Get('/user/progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user progress on problems' })
  @ApiResponse({
    status: 200,
    description: 'User progress statistics',
    type: UserProgressResponseDto,
  })
  getUserProgress(@Req() req): Promise<UserProgressResponseDto> {
    const userId = req.user.id;
    return this.problemService.getUserProgress(userId);
  }

  @Get('recommendations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get recommended problems for user' })
  @ApiResponse({
    status: 200,
    description: 'Recommended problems based on user topics',
    type: RecommendedResponseDto,
  })
  getRecommendedProblems(@Req() req): Promise<RecommendedResponseDto> {
    const userId = req.user.id;
    return this.problemService.getRecommended(userId);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search problems by query' })
  @ApiResponse({
    status: 200,
    description: 'Search results with pagination',
    type: ProblemResponseDto,
    isArray: true,
  })
  @ApiResponse({
    status: 400,
    description: 'Search query cannot be empty',
  })
  search(
    @Query('q') query: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResult<ProblemResponseDto>> {
    return this.problemService.searchProblems(query, paginationDto);
  }

  @Get('/trending')
  @ApiOperation({ summary: 'Get trending problems' })
  @ApiResponse({
    status: 200,
    description: 'Top 10 trending problems',
    type: TrendingResponseDto,
  })
  getTrending(): Promise<TrendingResponseDto> {
    return this.problemService.getTrending();
  }

  @Get(':slug')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get problem details by slug' })
  @ApiResponse({
    status: 200,
    description: 'Detailed problem information',
    type: ProblemDetailResponseDto,
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get problem statistics' })
  @ApiResponse({
    status: 200,
    description: 'Problem submission and performance stats',
    type: ProblemStatsResponseDto,
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user submissions for a problem' })
  @ApiResponse({
    status: 200,
    description: 'User submission history for problem',
    type: UserSubmissionDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Problem not found',
  })
  getUserProblemSubmissions(
    @Param('slug') slug: string,
    @Req() req,
  ): Promise<UserSubmissionDto> {
    const userId = req.user.id;
    return this.problemService.getUserProblemSubmissions(slug, userId);
  }
  //ADMIN ENDPOINTS
  //TODO MAKE SURE USER HAS ROLE ADMIN
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new problem (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Problem created successfully',
    type: ProblemDetailResponseDto,
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update problem (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Problem updated successfully',
    type: ProblemDetailResponseDto,
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete problem (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Problem deleted successfully',
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
