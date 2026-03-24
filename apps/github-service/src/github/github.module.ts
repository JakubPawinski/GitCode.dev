import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { GithubController } from './github.controller';
import { GithubTokenService } from './services/github-token.service';
import { RepositoryService } from './services/repository.service';
import { CommitService } from './services/commit.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UserConsumer } from './user.consumer';
import { CommitConsumer } from './services/commit.consumer';

@Module({
  imports: [HttpModule, ConfigModule, PrismaModule],
  controllers: [GithubController, UserConsumer, CommitConsumer],
  providers: [GithubTokenService, RepositoryService, CommitService],
})
export class GithubModule {}
