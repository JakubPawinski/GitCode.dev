import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import { GithubTokenService } from './github-token.service';
import { RepositoryResponseDto } from '../dto/github-response.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RepositoryService {
  private readonly logger = new Logger(RepositoryService.name);
  private readonly DEFAULT_REPO_NAME: string;
  private readonly DEFAULT_REPO_DESCRIPTION: string;

  constructor(
    private readonly tokenService: GithubTokenService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.DEFAULT_REPO_NAME = this.configService.get<string>(
      'GITHUB_DEFAULT_REPO_NAME',
      'gitcode-solutions', // fallback value
    );
    this.DEFAULT_REPO_DESCRIPTION = this.configService.get<string>(
      'GITHUB_DEFAULT_REPO_DESCRIPTION',
      'Repository for GitCode.dev user solutions', // fallback value
    );
  }
  async createOrGetRepository(userId: string): Promise<RepositoryResponseDto> {
    const token = await this.tokenService.getGitHubTokenForUser(userId);
    const octokit = new Octokit({ auth: token });

    const repoName = this.DEFAULT_REPO_NAME;

    try {
      // Find user in github-service database by userId from auth-service
      const dbUser = await this.prisma.user.findUnique({
        where: { userId },
      });

      if (!dbUser) {
        throw new BadRequestException(
          'User not found in github-service database. Please sync user first.',
        );
      }
      // Get authenticated user
      const { data: user } = await octokit.users.getAuthenticated();
      this.logger.debug(`Creating/getting repo for user: ${user.login}`);

      // Check if repo exists on GitHub
      let githubRepo;
      let created = false;

      // Check if repo exists
      try {
        githubRepo = await octokit.repos.get({
          owner: user.login,
          repo: repoName,
        });
      } catch (error) {
        if (error.status !== 404) throw error;

        // Create new repository on GitHub
        githubRepo = await octokit.repos.createForAuthenticatedUser({
          name: repoName,
          description: this.DEFAULT_REPO_DESCRIPTION,
          private: false,
          auto_init: true,
        });
        created = true;
        this.logger.log(`Repository ${repoName} created on GitHub`);
      }

      // Upsert repository in our database
      await this.prisma.repository.upsert({
        where: {
          userId_name: {
            userId,
            name: repoName,
          },
        },
        update: {
          fullName: githubRepo.data.full_name,
          githubId: githubRepo.data.id,
          htmlUrl: githubRepo.data.html_url,
          isPrivate: githubRepo.data.private,
        },
        create: {
          userId,
          name: githubRepo.data.name,
          fullName: githubRepo.data.full_name,
          githubId: githubRepo.data.id,
          htmlUrl: githubRepo.data.html_url,
          isPrivate: githubRepo.data.private,
        },
      });

      this.logger.log(`Repository ${repoName} synced to database`);

      return {
        name: githubRepo.data.name,
        fullName: githubRepo.data.full_name,
        htmlUrl: githubRepo.data.html_url,
        isPrivate: githubRepo.data.private,
        created,
      };
    } catch (error) {
      this.logger.error(`Failed to create repository: ${error.message}`);
      throw new BadRequestException(
        `Failed to create GitHub repository: ${error.message}`,
      );
    }
  }
}
