import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import { GithubTokenService } from './github-token.service';
import { FileChangeDto } from '../dto/commit-changes.dto';
import { CommitResponseDto } from '../dto/github-response.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CommitService {
  private readonly logger = new Logger(CommitService.name);
  private readonly DEFAULT_REPO_NAME: string;
  constructor(
    private readonly tokenService: GithubTokenService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.DEFAULT_REPO_NAME = this.configService.get<string>(
      'GITHUB_DEFAULT_REPO_NAME',
      'gitcode-solutions', // fallback value
    );
  }

  async commitAndPushFiles(
    userId: string,
    files: FileChangeDto[],
    message: string,
    branch: string = 'main',
  ): Promise<CommitResponseDto> {
    const token = await this.tokenService.getGitHubTokenForUser(userId);
    const octokit = new Octokit({ auth: token });
    const repoName = this.DEFAULT_REPO_NAME;

    try {
      // Get authenticated user
      const { data: user } = await octokit.users.getAuthenticated();
      const owner = user.login;

      this.logger.debug(
        `Committing ${files.length} files to ${owner}/${repoName}`,
      );

      // Get reference to branch
      const { data: ref } = await octokit.git.getRef({
        owner,
        repo: repoName,
        ref: `heads/${branch}`,
      });

      const currentCommitSha = ref.object.sha;

      // Get current commit to access the tree
      const { data: currentCommit } = await octokit.git.getCommit({
        owner,
        repo: repoName,
        commit_sha: currentCommitSha,
      });

      // Create blobs for each file
      const blobs = await Promise.all(
        files.map(async (file) => {
          const { data: blob } = await octokit.git.createBlob({
            owner,
            repo: repoName,
            content: Buffer.from(file.content).toString('base64'),
            encoding: 'base64',
          });
          return {
            path: file.path,
            mode: '100644' as const,
            type: 'blob' as const,
            sha: blob.sha,
          };
        }),
      );

      // Create new tree
      const { data: newTree } = await octokit.git.createTree({
        owner,
        repo: repoName,
        base_tree: currentCommit.tree.sha,
        tree: blobs,
      });

      // Create commit
      const { data: newCommit } = await octokit.git.createCommit({
        owner,
        repo: repoName,
        message,
        tree: newTree.sha,
        parents: [currentCommitSha],
      });

      // Update reference
      await octokit.git.updateRef({
        owner,
        repo: repoName,
        ref: `heads/${branch}`,
        sha: newCommit.sha,
      });

      this.logger.log(`Successfully committed: ${newCommit.sha}`);

      // Find repository in database
      const repository = await this.prisma.repository.findUnique({
        where: {
          userId_name: {
            userId,
            name: repoName,
          },
        },
      });

      if (!repository) {
        throw new BadRequestException(
          'Repository not found in database. Please create it first.',
        );
      }

      // Save commit to database
      await this.prisma.commit.create({
        data: {
          userId,
          repositoryId: repository.id,
          sha: newCommit.sha,
          message: newCommit.message,
          url: newCommit.html_url,
          branch,
          fileCount: files.length,
          committedAt: new Date(newCommit.committer.date),
        },
      });

      this.logger.log(`Commit ${newCommit.sha} saved to database`);

      return {
        sha: newCommit.sha,
        message: newCommit.message,
        url: newCommit.html_url,
        committedAt: newCommit.committer.date,
      };
    } catch (error) {
      this.logger.error(`Failed to commit files: ${error.message}`);
      throw new BadRequestException(
        `Failed to commit to GitHub: ${error.message}`,
      );
    }
  }

  async updateReadme(
    userId: string,
    content: string,
  ): Promise<CommitResponseDto> {
    // Check README generation limit for FREE users
    await this.checkReadmeLimit(userId);

    const result = await this.commitAndPushFiles(
      userId,
      [{ path: 'README.md', content }],
      'Update README.md',
      'main',
    );

    // Increment README generation counter
    await this.incrementReadmeCount(userId);

    return result;
  }

  private async checkReadmeLimit(userId: string): Promise<void> {
    // Get user tier
    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: { tier: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Premium users have unlimited generations
    if (user.tier === 'PREMIUM' || user.tier === 'ENTERPRISE') {
      return;
    }

    // Check FREE user limit (3 per month)
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const readmeGen = await this.prisma.readmeGeneration.findUnique({
      where: {
        userId_year_month: {
          userId,
          year,
          month,
        },
      },
    });

    const FREE_TIER_LIMIT = 3;

    if (readmeGen && readmeGen.count >= FREE_TIER_LIMIT) {
      throw new BadRequestException(
        `Free tier limit reached. You can only generate ${FREE_TIER_LIMIT} READMEs per month. Upgrade to Premium for unlimited generations.`,
      );
    }
  }

  private async incrementReadmeCount(userId: string): Promise<void> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    await this.prisma.readmeGeneration.upsert({
      where: {
        userId_year_month: {
          userId,
          year,
          month,
        },
      },
      update: {
        count: {
          increment: 1,
        },
      },
      create: {
        userId,
        year,
        month,
        count: 1,
      },
    });
  }
}
