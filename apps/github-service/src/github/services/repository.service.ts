import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import { GithubTokenService } from './github-token.service';
import { RepositoryResponseDto } from '../dto/github-response.dto';

@Injectable()
export class RepositoryService {
  private readonly logger = new Logger(RepositoryService.name);
  private readonly DEFAULT_REPO_NAME: string;
  private readonly DEFAULT_REPO_DESCRIPTION: string;

  constructor(
    private readonly tokenService: GithubTokenService,
    private readonly configService: ConfigService,
  ) {
    this.DEFAULT_REPO_NAME = this.configService.get<string>(
      'GITHUB_DEFAULT_REPO_NAME',
      'gitcode-solutions', // fallback value
    );
    this.DEFAULT_REPO_DESCRIPTION = this.configService.get<string>(
      'GITHUB_DEFAULT_REPO_DESCRIPTION',
      'Repository for GitCode.dev user solutions ', // fallback value
    );
  }
  async createOrGetRepository(userId: string): Promise<RepositoryResponseDto> {
    const token = await this.tokenService.getGitHubTokenForUser(userId);
    const octokit = new Octokit({ auth: token });

    const repoName = this.DEFAULT_REPO_NAME;

    try {
      // Get authenticated user
      const { data: user } = await octokit.users.getAuthenticated();
      this.logger.debug(`Creating/getting repo for user: ${user.login}`);

      // Check if repo exists
      try {
        const { data: existingRepo } = await octokit.repos.get({
          owner: user.login,
          repo: repoName,
        });

        this.logger.log(`Repository ${repoName} already exists`);

        return {
          name: existingRepo.name,
          fullName: existingRepo.full_name,
          htmlUrl: existingRepo.html_url,
          isPrivate: existingRepo.private,
          created: false,
        };
      } catch (error) {
        if (error.status !== 404) throw error;
        // Repo doesn't exist, create it
      }

      // Create new public repository
      const { data: newRepo } = await octokit.repos.createForAuthenticatedUser({
        name: repoName,
        description: this.DEFAULT_REPO_DESCRIPTION,
        private: false, // Force public
        auto_init: true,
      });

      this.logger.log(`Repository ${repoName} created successfully`);

      return {
        name: newRepo.name,
        fullName: newRepo.full_name,
        htmlUrl: newRepo.html_url,
        isPrivate: newRepo.private,
        created: true,
      };
    } catch (error) {
      this.logger.error(`Failed to create repository: ${error.message}`);
      throw new BadRequestException(
        `Failed to create GitHub repository: ${error.message}`,
      );
    }
  }
}
