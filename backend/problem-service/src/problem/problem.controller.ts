import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ProblemService } from './problem.service';
import { PaginatedResponseDto, PaginationDto } from './dto/pagination.dto';

@Controller('problem')
export class ProblemController {
  constructor(private readonly problemService: ProblemService) {}

  @Post()
  create(@Body() createProblemDto) {
    return this.problemService;
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.problemService.getPaginatedProblems(paginationDto);
  }

  @Get(':slug')
  findOne(@Param('slug') id: string) {
    return this.problemService.findProblemBySlug(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProblemDto) {
    return this.problemService;
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.problemService.remove(+id);
  }
}
