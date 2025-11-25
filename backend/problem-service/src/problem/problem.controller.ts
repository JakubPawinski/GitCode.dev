import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProblemService } from './problem.service';
import { PaginationDto } from './dto/pagination.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { CreateProblemDto } from './dto/create-problem.dto';

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

  // ADMIN ENDPOINTS
  @Post()
  @UseGuards(JwtAuthGuard)
  //TODO Implement role checking if admin
  create(@Body() createProblemDto: CreateProblemDto) {
    return this.problemService.createProblem(createProblemDto);
  }
}
