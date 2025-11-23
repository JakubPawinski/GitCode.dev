import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ProblemService } from './problem.service';
import { PaginationDto } from './dto/pagination.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('problems')
export class ProblemController {
  constructor(private readonly problemService: ProblemService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query() paginationDto: PaginationDto) {
    return this.problemService.getPaginatedProblems(paginationDto);
  }

  @Get(':slug')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('slug') id: string) {
    return this.problemService.findProblemBySlug(id);
  }
}
