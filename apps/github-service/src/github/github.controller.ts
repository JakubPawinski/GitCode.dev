import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard, User } from '@gitcode/auth';
import type { AuthenticatedUser } from '@gitcode/types';
import { RepositoryService } from './services/repository.service';
import { CommitService } from './services/commit.service';
import { CommitChangesDto } from './dto';
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
    @User() user: AuthenticatedUser,
  ): Promise<RepositoryResponseDto> {
    return this.repositoryService.createOrGetRepository(user.id);
  }

  @Post('commit')
  @ApiOperation({ summary: 'Commit and push files to repository' })
  @ApiResponse({ status: 201, type: CommitResponseDto })
  async commitChanges(
    @User() user: AuthenticatedUser,
    @Body() dto: CommitChangesDto,
  ): Promise<CommitResponseDto> {
    return this.commitService.commitAndPushFiles(
      user.id,
      dto.files,
      dto.message,
      dto.branch || 'main',
    );
  }

  @Post('readme')
  @ApiOperation({ summary: 'Update README.md file' })
  @ApiResponse({ status: 200, type: CommitResponseDto })
  async updateReadme(
    @User() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    return this.commitService.handleReadmeUpdate(user.id);
  }
}
