import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { CommitService } from './commit.service';
import { GithubTokenService } from './github-token.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBus } from '@gitcode/messaging';
import {
  AI_PATTERNS,
  GenerateReadmeCommand,
  GITHUB_PATTERNS,
  FileCommittedEvent,
} from '@gitcode/contracts';
import { FileChangeDto } from '../dto/commit-changes.dto';

jest.mock('@octokit/rest');

describe('CommitService', () => {
  let service: CommitService;
  let tokenService: jest.Mocked<GithubTokenService>;
  let configService: jest.Mocked<ConfigService>;
  let prisma: any;
  let eventBus: jest.Mocked<EventBus>;

  const mockUserId = 'user-123';
  const mockToken = 'github_token_xyz';
  const mockGithubUsername = 'testuser';
  const mockRepoName = 'gitcode-solutions';
  const mockSubmissionId = 'submission-456';

  const mockGithubUser = {
    login: mockGithubUsername,
  };

  const mockRef = {
    object: {
      sha: 'ref-sha-123',
    },
  };

  const mockCommitData = {
    tree: {
      sha: 'tree-sha-123',
    },
  };

  const mockBlob = {
    sha: 'blob-sha-123',
  };

  const mockNewTree = {
    sha: 'new-tree-sha-456',
  };

  const mockNewCommit = {
    sha: 'commit-sha-789',
    message: 'Add solution for problem #1',
    html_url: 'https://github.com/testuser/gitcode-solutions/commit/789',
    committer: {
      date: '2026-02-01T19:30:00Z',
    },
  };

  const mockDbRepository = {
    id: 'repo-db-1',
    userId: mockUserId,
    name: mockRepoName,
    fullName: `${mockGithubUsername}/${mockRepoName}`,
    githubId: 12345,
    htmlUrl: `https://github.com/${mockGithubUsername}/${mockRepoName}`,
    isPrivate: false,
  };

  const mockFiles: FileChangeDto[] = [
    { path: 'solution.ts', content: 'export const solution = 1;' },
    { path: 'test.spec.ts', content: 'describe("test", () => {});' },
  ];

  beforeEach(async () => {
    const prismaServiceMock = {
      repository: {
        findUnique: jest.fn(),
      },
      commit: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommitService,
        {
          provide: GithubTokenService,
          useValue: {
            getGitHubTokenForUser: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              const config: Record<string, string> = {
                GITHUB_DEFAULT_REPO_NAME: mockRepoName,
              };
              return config[key] || defaultValue;
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: prismaServiceMock,
        },
        {
          provide: EventBus,
          useValue: {
            publish: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CommitService>(CommitService);
    tokenService = module.get(
      GithubTokenService,
    ) as jest.Mocked<GithubTokenService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
    prisma = module.get(PrismaService);
    eventBus = module.get(EventBus) as jest.Mocked<EventBus>;
  });

  describe('commitAndPushFiles', () => {
    it('should commit and push files successfully without submissionId', async () => {
      const mockOctokit = {
        users: {
          getAuthenticated: jest.fn().mockResolvedValue({
            data: mockGithubUser,
          }),
        },
        git: {
          getRef: jest.fn().mockResolvedValue({ data: mockRef }),
          getCommit: jest.fn().mockResolvedValue({ data: mockCommitData }),
          createBlob: jest
            .fn()
            .mockResolvedValue({ data: mockBlob })
            .mockResolvedValueOnce({ data: mockBlob }),
          createTree: jest.fn().mockResolvedValue({ data: mockNewTree }),
          createCommit: jest.fn().mockResolvedValue({ data: mockNewCommit }),
          updateRef: jest.fn().mockResolvedValue({}),
        },
      };

      jest
        .spyOn(require('@octokit/rest'), 'Octokit')
        .mockImplementation(() => mockOctokit);

      tokenService.getGitHubTokenForUser.mockResolvedValue(mockToken);
      prisma.repository.findUnique.mockResolvedValue(mockDbRepository);
      prisma.commit.create.mockResolvedValue({});

      const result = await service.commitAndPushFiles(
        mockUserId,
        mockFiles,
        'Add solution',
        'main',
      );

      expect(result).toEqual({
        sha: mockNewCommit.sha,
        message: mockNewCommit.message,
        url: mockNewCommit.html_url,
        committedAt: mockNewCommit.committer.date,
      });

      expect(mockOctokit.git.createCommit).toHaveBeenCalledWith({
        owner: mockGithubUsername,
        repo: mockRepoName,
        message: 'Add solution',
        tree: mockNewTree.sha,
        parents: [mockRef.object.sha],
      });

      expect(prisma.commit.create).toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should commit and push files with submissionId and publish event', async () => {
      const mockOctokit = {
        users: {
          getAuthenticated: jest.fn().mockResolvedValue({
            data: mockGithubUser,
          }),
        },
        git: {
          getRef: jest.fn().mockResolvedValue({ data: mockRef }),
          getCommit: jest.fn().mockResolvedValue({ data: mockCommitData }),
          createBlob: jest
            .fn()
            .mockResolvedValue({ data: mockBlob })
            .mockResolvedValueOnce({ data: mockBlob }),
          createTree: jest.fn().mockResolvedValue({ data: mockNewTree }),
          createCommit: jest.fn().mockResolvedValue({ data: mockNewCommit }),
          updateRef: jest.fn().mockResolvedValue({}),
        },
      };

      jest
        .spyOn(require('@octokit/rest'), 'Octokit')
        .mockImplementation(() => mockOctokit);

      tokenService.getGitHubTokenForUser.mockResolvedValue(mockToken);
      prisma.repository.findUnique.mockResolvedValue(mockDbRepository);
      prisma.commit.create.mockResolvedValue({});
      eventBus.publish.mockResolvedValue(undefined);

      const result = await service.commitAndPushFiles(
        mockUserId,
        mockFiles,
        'Add solution',
        'main',
        mockSubmissionId,
      );

      expect(result).toEqual({
        sha: mockNewCommit.sha,
        message: mockNewCommit.message,
        url: mockNewCommit.html_url,
        committedAt: mockNewCommit.committer.date,
      });

      expect(eventBus.publish).toHaveBeenCalledWith(
        GITHUB_PATTERNS.FILE_COMMITTED,
        expect.any(FileCommittedEvent),
      );
    });

    it('should handle single file commit', async () => {
      const singleFile: FileChangeDto[] = [
        { path: 'README.md', content: '# Solution' },
      ];

      const mockOctokit = {
        users: {
          getAuthenticated: jest.fn().mockResolvedValue({
            data: mockGithubUser,
          }),
        },
        git: {
          getRef: jest.fn().mockResolvedValue({ data: mockRef }),
          getCommit: jest.fn().mockResolvedValue({ data: mockCommitData }),
          createBlob: jest.fn().mockResolvedValue({ data: mockBlob }),
          createTree: jest.fn().mockResolvedValue({ data: mockNewTree }),
          createCommit: jest.fn().mockResolvedValue({ data: mockNewCommit }),
          updateRef: jest.fn().mockResolvedValue({}),
        },
      };

      jest
        .spyOn(require('@octokit/rest'), 'Octokit')
        .mockImplementation(() => mockOctokit);

      tokenService.getGitHubTokenForUser.mockResolvedValue(mockToken);
      prisma.repository.findUnique.mockResolvedValue(mockDbRepository);
      prisma.commit.create.mockResolvedValue({});

      await service.commitAndPushFiles(
        mockUserId,
        singleFile,
        'Update README',
        'main',
      );

      expect(mockOctokit.git.createBlob).toHaveBeenCalledTimes(1);
      expect(prisma.commit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fileCount: 1,
          }),
        }),
      );
    });

    it('should use default branch "main" when branch is not provided', async () => {
      const mockOctokit = {
        users: {
          getAuthenticated: jest.fn().mockResolvedValue({
            data: mockGithubUser,
          }),
        },
        git: {
          getRef: jest.fn().mockResolvedValue({ data: mockRef }),
          getCommit: jest.fn().mockResolvedValue({ data: mockCommitData }),
          createBlob: jest.fn().mockResolvedValue({ data: mockBlob }),
          createTree: jest.fn().mockResolvedValue({ data: mockNewTree }),
          createCommit: jest.fn().mockResolvedValue({ data: mockNewCommit }),
          updateRef: jest.fn().mockResolvedValue({}),
        },
      };

      jest
        .spyOn(require('@octokit/rest'), 'Octokit')
        .mockImplementation(() => mockOctokit);

      tokenService.getGitHubTokenForUser.mockResolvedValue(mockToken);
      prisma.repository.findUnique.mockResolvedValue(mockDbRepository);
      prisma.commit.create.mockResolvedValue({});

      await service.commitAndPushFiles(mockUserId, mockFiles, 'Add solution');

      expect(mockOctokit.git.getRef).toHaveBeenCalledWith({
        owner: mockGithubUsername,
        repo: mockRepoName,
        ref: 'heads/main',
      });
    });

    it('should throw BadRequestException when repository not found', async () => {
      const mockOctokit = {
        users: {
          getAuthenticated: jest.fn().mockResolvedValue({
            data: mockGithubUser,
          }),
        },
        git: {
          getRef: jest.fn().mockResolvedValue({ data: mockRef }),
          getCommit: jest.fn().mockResolvedValue({ data: mockCommitData }),
          createBlob: jest.fn().mockResolvedValue({ data: mockBlob }),
          createTree: jest.fn().mockResolvedValue({ data: mockNewTree }),
          createCommit: jest.fn().mockResolvedValue({ data: mockNewCommit }),
          updateRef: jest.fn().mockResolvedValue({}),
        },
      };

      jest
        .spyOn(require('@octokit/rest'), 'Octokit')
        .mockImplementation(() => mockOctokit);

      tokenService.getGitHubTokenForUser.mockResolvedValue(mockToken);
      prisma.repository.findUnique.mockResolvedValue(null);

      await expect(
        service.commitAndPushFiles(mockUserId, mockFiles, 'Add solution'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.commitAndPushFiles(mockUserId, mockFiles, 'Add solution'),
      ).rejects.toThrow('Repository not found in database');
    });

    it('should handle GitHub API errors', async () => {
      tokenService.getGitHubTokenForUser.mockResolvedValue(mockToken);

      const mockOctokit = {
        users: {
          getAuthenticated: jest
            .fn()
            .mockRejectedValue(new Error('GitHub API Error')),
        },
      };

      jest
        .spyOn(require('@octokit/rest'), 'Octokit')
        .mockImplementation(() => mockOctokit);

      await expect(
        service.commitAndPushFiles(mockUserId, mockFiles, 'Add solution'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should encode file content as base64', async () => {
      const mockOctokit = {
        users: {
          getAuthenticated: jest.fn().mockResolvedValue({
            data: mockGithubUser,
          }),
        },
        git: {
          getRef: jest.fn().mockResolvedValue({ data: mockRef }),
          getCommit: jest.fn().mockResolvedValue({ data: mockCommitData }),
          createBlob: jest.fn().mockResolvedValue({ data: mockBlob }),
          createTree: jest.fn().mockResolvedValue({ data: mockNewTree }),
          createCommit: jest.fn().mockResolvedValue({ data: mockNewCommit }),
          updateRef: jest.fn().mockResolvedValue({}),
        },
      };

      jest
        .spyOn(require('@octokit/rest'), 'Octokit')
        .mockImplementation(() => mockOctokit);

      tokenService.getGitHubTokenForUser.mockResolvedValue(mockToken);
      prisma.repository.findUnique.mockResolvedValue(mockDbRepository);
      prisma.commit.create.mockResolvedValue({});

      await service.commitAndPushFiles(mockUserId, mockFiles, 'Add solution');

      expect(mockOctokit.git.createBlob).toHaveBeenCalledWith(
        expect.objectContaining({
          encoding: 'base64',
          content: expect.any(String),
        }),
      );
    });

    it('should save commit with correct data to database', async () => {
      const mockOctokit = {
        users: {
          getAuthenticated: jest.fn().mockResolvedValue({
            data: mockGithubUser,
          }),
        },
        git: {
          getRef: jest.fn().mockResolvedValue({ data: mockRef }),
          getCommit: jest.fn().mockResolvedValue({ data: mockCommitData }),
          createBlob: jest.fn().mockResolvedValue({ data: mockBlob }),
          createTree: jest.fn().mockResolvedValue({ data: mockNewTree }),
          createCommit: jest.fn().mockResolvedValue({ data: mockNewCommit }),
          updateRef: jest.fn().mockResolvedValue({}),
        },
      };

      jest
        .spyOn(require('@octokit/rest'), 'Octokit')
        .mockImplementation(() => mockOctokit);

      tokenService.getGitHubTokenForUser.mockResolvedValue(mockToken);
      prisma.repository.findUnique.mockResolvedValue(mockDbRepository);
      prisma.commit.create.mockResolvedValue({});

      await service.commitAndPushFiles(
        mockUserId,
        mockFiles,
        'Add solution',
        'feature/branch',
        mockSubmissionId,
      );

      expect(prisma.commit.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          repositoryId: mockDbRepository.id,
          sha: mockNewCommit.sha,
          message: mockNewCommit.message,
          url: mockNewCommit.html_url,
          branch: 'feature/branch',
          fileCount: mockFiles.length,
          submissionId: mockSubmissionId,
          committedAt: expect.any(Date),
        },
      });
    });
  });

  describe('updateReadme', () => {
    it('should update README.md file', async () => {
      const customNewCommit = {
        ...mockNewCommit,
        message: 'Update README.md',
      };

      const mockOctokit = {
        users: {
          getAuthenticated: jest.fn().mockResolvedValue({
            data: mockGithubUser,
          }),
        },
        git: {
          getRef: jest.fn().mockResolvedValue({ data: mockRef }),
          getCommit: jest.fn().mockResolvedValue({ data: mockCommitData }),
          createBlob: jest.fn().mockResolvedValue({ data: mockBlob }),
          createTree: jest.fn().mockResolvedValue({ data: mockNewTree }),
          createCommit: jest.fn().mockResolvedValue({ data: customNewCommit }),
          updateRef: jest.fn().mockResolvedValue({}),
        },
      };

      jest
        .spyOn(require('@octokit/rest'), 'Octokit')
        .mockImplementation(() => mockOctokit);

      tokenService.getGitHubTokenForUser.mockResolvedValue(mockToken);
      prisma.repository.findUnique.mockResolvedValue(mockDbRepository);
      prisma.commit.create.mockResolvedValue({});

      const readmeContent = '# My Solutions\n\nThis is my README';
      const encodedContent = Buffer.from(readmeContent).toString('base64');

      await service.updateReadme(mockUserId, readmeContent);

      expect(mockOctokit.git.createBlob).toHaveBeenCalledWith(
        expect.objectContaining({
          content: encodedContent,
          encoding: 'base64',
        }),
      );

      expect(prisma.commit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            message: 'Update README.md',
          }),
        }),
      );
    });
  });

  describe('handleReadmeUpdate', () => {
    it('should publish GenerateReadmeCommand event', async () => {
      eventBus.publish.mockResolvedValue(undefined);

      const result = await service.handleReadmeUpdate(mockUserId);

      expect(result).toEqual({
        message: 'Readme update initiated',
      });

      expect(eventBus.publish).toHaveBeenCalledWith(
        AI_PATTERNS.GENERATE_README,
        expect.any(GenerateReadmeCommand),
      );
    });

    it('should pass correct userId to GenerateReadmeCommand', async () => {
      eventBus.publish.mockResolvedValue(undefined);

      await service.handleReadmeUpdate(mockUserId);

      const publishCall = eventBus.publish.mock.calls[0];
      const command = publishCall[1] as GenerateReadmeCommand;

      expect(command.userId).toBe(mockUserId);
    });
  });

  describe('Configuration', () => {
    it('should use default repo name from config', async () => {
      expect(configService.get).toHaveBeenCalledWith(
        'GITHUB_DEFAULT_REPO_NAME',
        'gitcode-solutions',
      );
    });
  });

  describe('Service Definition', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });
});
