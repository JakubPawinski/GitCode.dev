import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { GithubController } from './github.controller';
import { GithubService } from './github.service';
import { GithubTokenService } from './services/github-token.service';
import { RepositoryService } from './services/repository.service';
import { CommitService } from './services/commit.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UserConsumer } from './user.consumer';

@Module({
  imports: [HttpModule, ConfigModule, PrismaModule],
  controllers: [GithubController, UserConsumer],
  providers: [
    GithubService,
    GithubTokenService,
    RepositoryService,
    CommitService,
  ],
  exports: [GithubService],
})
export class GithubModule {}
