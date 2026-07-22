import {
  Injectable,
  Logger,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import { GithubTokenService } from './github-token.service';
import { FileChangeDto } from '../dto';
import { CommitResponseDto } from '../dto';
import { EventBus } from '@gitcode/messaging';
import {
  AI_PATTERNS,
  GenerateReadmeCommand,
  GITHUB_PATTERNS,
  FileCommittedEvent,
} from '@gitcode/contracts';
import { TokenName } from '../../shared/token-name.enum.ts';
import { PrismaClient } from '@prisma/client-github';

@Injectable()
export class CommitService {
  private readonly logger = new Logger(CommitService.name);
  private readonly DEFAULT_REPO_NAME: string;
  constructor(
    private readonly tokenService: GithubTokenService,
    private readonly configService: ConfigService,
    @Inject(TokenName.PRISMA_GITHUB) private readonly prismaConnectionService: PrismaClient,
    private eventBus: EventBus,
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
    submissionId?: string,
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
      const repository = await this.prismaConnectionService.repository.findUnique({
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
      await this.prismaConnectionService.commit.create({
        data: {
          userId,
          repositoryId: repository.id,
          sha: newCommit.sha,
          message: newCommit.message,
          url: newCommit.html_url,
          branch,
          fileCount: files.length,
          submissionId: submissionId || null,
          committedAt: new Date(newCommit.committer.date),
        },
      });

      this.logger.log(`Commit ${newCommit.sha} saved to database`);
      if (submissionId) {
        this.logger.log(`Publish ${GITHUB_PATTERNS.FILE_COMMITTED} event`);
        await this.eventBus.publish(
          GITHUB_PATTERNS.FILE_COMMITTED,
          new FileCommittedEvent(
            userId,
            newCommit.sha,
            newCommit.message,
            newCommit.html_url,
            repoName,
            branch,
            files.map((file) => file.path),
            new Date(newCommit.committer.date).toISOString(),
            submissionId,
          ),
        );
      }
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

  async updateReadme(userId: string, content: string): Promise<void> {
    await this.commitAndPushFiles(
      userId,
      [{ path: 'README.md', content }],
      'Update README.md',
      'main',
    );
  }

  async handleReadmeUpdate(userId: string): Promise<{ message: string }> {
    await this.eventBus.publish(
      AI_PATTERNS.GENERATE_README,
      new GenerateReadmeCommand(userId),
    );
    return {
      message: 'Readme update initiated',
    };
  }
}
