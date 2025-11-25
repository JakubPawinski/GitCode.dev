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
import { ProblemService } from './problem.service';
import { PaginationDto } from './dto/pagination.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';

@Controller('problems')
export class ProblemController {
  constructor(private readonly problemService: ProblemService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query() paginationDto: PaginationDto) {
    return this.problemService.getPaginatedProblems(paginationDto);
  }

  @Get('/user/progress')
  @UseGuards(JwtAuthGuard)
  getUserProgess(@Req() req) {
    const userId = req.user.id;
    return this.problemService.getUserProgress(userId);
  }

  @Get('recommendations')
  @UseGuards(JwtAuthGuard)
  getRecommendedProblems(@Req() req) {
    const userId = req.user.id;
    return this.problemService.getRecommended(userId);
  }
  @Get('search')
  @UseGuards(JwtAuthGuard)
  search(@Query('q') query: string, @Query() paginationDto: PaginationDto) {
    return this.problemService.searchProblems(query, paginationDto);
  }

  @Get('/trending')
  getTrending() {
    return this.problemService.getTrending();
  }
  @Get(':slug')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('slug') id: string) {
    return this.problemService.findProblemBySlug(id);
  }

  //STATS ENDPOINT
  @Get(':slug/stats')
  @UseGuards(JwtAuthGuard)
  getStats(@Param('slug') slug: string) {
    return this.problemService.getProblemStats(slug);
  }
  @Get(':slug/submissions')
  @UseGuards(JwtAuthGuard)
  getUserProblemSubmissions(@Param('slug') slug: string, @Req() req) {
    const userId = req.user.id;
    return this.problemService.getUserProblemSubmissions(slug, userId);
  }

  // ADMIN ENDPOINTS
  @Post()
  @UseGuards(JwtAuthGuard)
  //TODO Implement role checking if admin
  create(@Body() createProblemDto: CreateProblemDto) {
    return this.problemService.createProblem(createProblemDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  //TODO Implement role checking if admin
  update(@Param('id') id: string, @Body() updateProblemDto: UpdateProblemDto) {
    return this.problemService.updateProblem(id, updateProblemDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  //TODO Implement role checking if admin
  delete(@Param('id') id: string) {
    return this.problemService.deleteProblem(id);
  }
}
