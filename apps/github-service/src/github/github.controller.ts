import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { GithubService } from './github.service';
import { CreateGithubDto } from './dto/create-github.dto';
import { UpdateGithubDto } from './dto/update-github.dto';

@Controller('github')
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @Post()
  create(@Body() createGithubDto: CreateGithubDto) {
    return this.githubService.create(createGithubDto);
  }

  @Get()
  findAll() {
    return this.githubService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.githubService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGithubDto: UpdateGithubDto) {
    return this.githubService.update(+id, updateGithubDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.githubService.remove(+id);
  }
}
