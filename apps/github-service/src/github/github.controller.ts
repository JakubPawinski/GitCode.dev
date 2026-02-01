import { Controller, Post, Patch, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@gitcode/auth';
import { RepositoryService } from './services/repository.service';
import { CommitService } from './services/commit.service';
import { CreateRepositoryDto, CommitChangesDto, UpdateReadmeDto } from './dto';
import {
  RepositoryResponseDto,
  CommitResponseDto,
} from './dto/github-response.dto';

@Controller('github')
@ApiTags('GitHub Integration')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('Bearer Auth')
export class GithubController {
  constructor(
    private readonly repositoryService: RepositoryService,
    private readonly commitService: CommitService,
  ) {}

  @Post('repository')
  @ApiOperation({ summary: 'Create or get GitCode solutions repository' })
  @ApiResponse({ status: 201, type: RepositoryResponseDto })
  async createRepository(
    @Body() dto: CreateRepositoryDto,
  ): Promise<RepositoryResponseDto> {
    return this.repositoryService.createOrGetRepository(dto.userId);
  }

  @Post('commit')
  @ApiOperation({ summary: 'Commit and push files to repository' })
  @ApiResponse({ status: 201, type: CommitResponseDto })
  async commitChanges(
    @Body() dto: CommitChangesDto,
  ): Promise<CommitResponseDto> {
    return this.commitService.commitAndPushFiles(
      dto.userId,
      dto.files,
      dto.message,
      dto.branch || 'main',
    );
  }

  @Patch('readme')
  @ApiOperation({ summary: 'Update README.md file' })
  @ApiResponse({ status: 200, type: CommitResponseDto })
  async updateReadme(@Body() dto: UpdateReadmeDto): Promise<CommitResponseDto> {
    return this.commitService.updateReadme(dto.userId, dto.content);
  }
}
