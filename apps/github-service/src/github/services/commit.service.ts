import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import { GithubTokenService } from './github-token.service';
import { FileChangeDto } from '../dto/commit-changes.dto';
import { CommitResponseDto } from '../dto/github-response.dto';

@Injectable()
export class CommitService {
  private readonly logger = new Logger(CommitService.name);
  private readonly DEFAULT_REPO_NAME: string;

  constructor(
    private readonly tokenService: GithubTokenService,
    private readonly configService: ConfigService,
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

    try {
      // Get authenticated user
      const { data: user } = await octokit.users.getAuthenticated();
      const owner = user.login;
      const repo = this.DEFAULT_REPO_NAME;

      this.logger.debug(`Committing ${files.length} files to ${owner}/${repo}`);

      // Get reference to branch
      const { data: ref } = await octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`,
      });

      const currentCommitSha = ref.object.sha;

      // Get current commit to access the tree
      const { data: currentCommit } = await octokit.git.getCommit({
        owner,
        repo,
        commit_sha: currentCommitSha,
      });

      // Create blobs for each file
      const blobs = await Promise.all(
        files.map(async (file) => {
          const { data: blob } = await octokit.git.createBlob({
            owner,
            repo,
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
        repo,
        base_tree: currentCommit.tree.sha,
        tree: blobs,
      });

      // Create commit
      const { data: newCommit } = await octokit.git.createCommit({
        owner,
        repo,
        message,
        tree: newTree.sha,
        parents: [currentCommitSha],
      });

      // Update reference
      await octokit.git.updateRef({
        owner,
        repo,
        ref: `heads/${branch}`,
        sha: newCommit.sha,
      });

      this.logger.log(`Successfully committed: ${newCommit.sha}`);

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
    return this.commitAndPushFiles(
      userId,
      [{ path: 'README.md', content }],
      'Update README.md',
      'main',
    );
  }
}
