import { Module } from '@nestjs/common';
import { GithubService } from './github.service';
import { GithubController } from './github.controller';
import { GithubTokenService } from './services/github-token.service';
import { RepositoryService } from './services/repository.service';
import { CommitService } from './services/commit.service';

@Module({
  controllers: [GithubController],
  providers: [GithubService, GithubTokenService, RepositoryService, CommitService],
})
export class GithubModule {}
