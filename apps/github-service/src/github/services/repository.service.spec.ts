import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, HttpException } from '@nestjs/common';
import { RepositoryService } from './repository.service';
import { GithubTokenService } from './github-token.service';
import { PrismaService } from '../../prisma/prisma.service';

jest.mock('@octokit/rest');

describe('RepositoryService', () => {
  let service: RepositoryService;
  let tokenService: jest.Mocked<GithubTokenService>;
  let prisma: any;
  let configService: jest.Mocked<ConfigService>;

  const mockUserId = 'user-123';
  const mockToken = 'github_token_xyz';
  const mockGithubUsername = 'testuser';
  const mockRepoName = 'gitcode-solutions';
  const mockRepoDescription = 'Repository for GitCode.dev user solutions';

  const mockGithubRepo = {
    name: mockRepoName,
    full_name: `${mockGithubUsername}/${mockRepoName}`,
    html_url: `https://github.com/${mockGithubUsername}/${mockRepoName}`,
    private: false,
    id: 12345,
  };

  const mockDbRepository = {
    id: 'repo-db-1',
    userId: mockUserId,
    name: mockRepoName,
    fullName: mockGithubRepo.full_name,
    githubId: mockGithubRepo.id,
    htmlUrl: mockGithubRepo.html_url,
    isPrivate: false,
  };

  const mockDbUser = {
    id: 'user-db-1',
    userId: mockUserId,
    githubUsername: mockGithubUsername,
  };

  beforeEach(async () => {
    const prismaServiceMock = {
      user: {
        findUnique: jest.fn(),
      },
      repository: {
        findUnique: jest.fn(),
        delete: jest.fn(),
        upsert: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepositoryService,
        {
          provide: GithubTokenService,
          useValue: {
            getGitHubTokenForUser: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: prismaServiceMock,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              const config: Record<string, string> = {
                GITHUB_DEFAULT_REPO_NAME: mockRepoName,
                GITHUB_DEFAULT_REPO_DESCRIPTION: mockRepoDescription,
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RepositoryService>(RepositoryService);
    tokenService = module.get(
      GithubTokenService,
    ) as jest.Mocked<GithubTokenService>;
    prisma = module.get(PrismaService);
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  describe('getRepository', () => {
    it('should return repository when it exists in database and on GitHub', async () => {
      const mockOctokit = {
        users: {
          getAuthenticated: jest.fn().mockResolvedValue({
            data: { login: mockGithubUsername },
          }),
        },
        repos: {
          get: jest.fn().mockResolvedValue({ data: mockGithubRepo }),
        },
      };

      jest
        .spyOn(require('@octokit/rest'), 'Octokit')
        .mockImplementation(() => mockOctokit);

      tokenService.getGitHubTokenForUser.mockResolvedValue(mockToken);
      prisma.repository.findUnique.mockResolvedValue(mockDbRepository);

      const result = await service.getRepository(mockUserId);

      expect(result).toEqual({
        name: mockGithubRepo.name,
        fullName: mockGithubRepo.full_name,
        htmlUrl: mockGithubRepo.html_url,
        isPrivate: mockGithubRepo.private,
        created: false,
      });

      expect(tokenService.getGitHubTokenForUser).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(prisma.repository.findUnique).toHaveBeenCalledWith({
        where: {
          userId_name: {
            userId: mockUserId,
            name: mockRepoName,
          },
        },
      });
    });

    it('should throw HttpException when repository does not exist in database', async () => {
      tokenService.getGitHubTokenForUser.mockResolvedValue(mockToken);
      prisma.repository.findUnique.mockResolvedValue(null);

      await expect(service.getRepository(mockUserId)).rejects.toThrow(
        HttpException,
      );
    });

    it('should clean up database when repo exists in DB but not on GitHub', async () => {
      const mockOctokit = {
        users: {
          getAuthenticated: jest.fn().mockResolvedValue({
            data: { login: mockGithubUsername },
          }),
        },
        repos: {
          get: jest
            .fn()
            .mockRejectedValue({ status: 404, message: 'Not Found' }),
        },
      };

      jest
        .spyOn(require('@octokit/rest'), 'Octokit')
        .mockImplementation(() => mockOctokit);

      tokenService.getGitHubTokenForUser.mockResolvedValue(mockToken);
      prisma.repository.findUnique.mockResolvedValue(mockDbRepository);
      prisma.repository.delete.mockResolvedValue(mockDbRepository);

      await expect(service.getRepository(mockUserId)).rejects.toThrow(
        HttpException,
      );

      expect(prisma.repository.delete).toHaveBeenCalledWith({
        where: { id: mockDbRepository.id },
      });
    });

    it('should throw BadRequestException on GitHub API error', async () => {
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

      tokenService.getGitHubTokenForUser.mockResolvedValue(mockToken);
      prisma.repository.findUnique.mockResolvedValue(mockDbRepository);

      await expect(service.getRepository(mockUserId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('createOrGetRepository', () => {
    it('should return existing repository when it exists on GitHub', async () => {
      const mockOctokit = {
        users: {
          getAuthenticated: jest.fn().mockResolvedValue({
            data: { login: mockGithubUsername },
          }),
        },
        repos: {
          get: jest.fn().mockResolvedValue({ data: mockGithubRepo }),
          createForAuthenticatedUser: jest.fn(),
        },
      };

      jest
        .spyOn(require('@octokit/rest'), 'Octokit')
        .mockImplementation(() => mockOctokit);

      tokenService.getGitHubTokenForUser.mockResolvedValue(mockToken);
      prisma.user.findUnique.mockResolvedValue(mockDbUser);
      prisma.repository.upsert.mockResolvedValue(mockDbRepository);

      const result = await service.createOrGetRepository(mockUserId);

      expect(result).toEqual({
        name: mockGithubRepo.name,
        fullName: mockGithubRepo.full_name,
        htmlUrl: mockGithubRepo.html_url,
        isPrivate: mockGithubRepo.private,
        created: false,
      });

      expect(
        mockOctokit.repos.createForAuthenticatedUser,
      ).not.toHaveBeenCalled();
      expect(prisma.repository.upsert).toHaveBeenCalled();
    });

    it('should create new repository when it does not exist on GitHub', async () => {
      const mockOctokit = {
        users: {
          getAuthenticated: jest.fn().mockResolvedValue({
            data: { login: mockGithubUsername },
          }),
        },
        repos: {
          get: jest
            .fn()
            .mockRejectedValue({ status: 404, message: 'Not Found' }),
          createForAuthenticatedUser: jest
            .fn()
            .mockResolvedValue({ data: mockGithubRepo }),
        },
      };

      jest
        .spyOn(require('@octokit/rest'), 'Octokit')
        .mockImplementation(() => mockOctokit);

      tokenService.getGitHubTokenForUser.mockResolvedValue(mockToken);
      prisma.user.findUnique.mockResolvedValue(mockDbUser);
      prisma.repository.upsert.mockResolvedValue(mockDbRepository);

      const result = await service.createOrGetRepository(mockUserId);

      expect(result).toEqual({
        name: mockGithubRepo.name,
        fullName: mockGithubRepo.full_name,
        htmlUrl: mockGithubRepo.html_url,
        isPrivate: mockGithubRepo.private,
        created: true,
      });

      expect(mockOctokit.repos.createForAuthenticatedUser).toHaveBeenCalledWith(
        {
          name: mockRepoName,
          description: mockRepoDescription,
          private: false,
          auto_init: true,
        },
      );

      expect(prisma.repository.upsert).toHaveBeenCalled();
    });

    it('should throw BadRequestException when user not found in database', async () => {
      tokenService.getGitHubTokenForUser.mockResolvedValue(mockToken);
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.createOrGetRepository(mockUserId)).rejects.toThrow(
        BadRequestException,
      );

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
    });

    it('should upsert repository in database with correct data', async () => {
      const mockOctokit = {
        users: {
          getAuthenticated: jest.fn().mockResolvedValue({
            data: { login: mockGithubUsername },
          }),
        },
        repos: {
          get: jest.fn().mockResolvedValue({ data: mockGithubRepo }),
          createForAuthenticatedUser: jest.fn(),
        },
      };

      jest
        .spyOn(require('@octokit/rest'), 'Octokit')
        .mockImplementation(() => mockOctokit);

      tokenService.getGitHubTokenForUser.mockResolvedValue(mockToken);
      prisma.user.findUnique.mockResolvedValue(mockDbUser);
      prisma.repository.upsert.mockResolvedValue(mockDbRepository);

      await service.createOrGetRepository(mockUserId);

      expect(prisma.repository.upsert).toHaveBeenCalledWith({
        where: {
          userId_name: {
            userId: mockUserId,
            name: mockRepoName,
          },
        },
        update: {
          fullName: mockGithubRepo.full_name,
          githubId: mockGithubRepo.id,
          htmlUrl: mockGithubRepo.html_url,
          isPrivate: mockGithubRepo.private,
        },
        create: {
          userId: mockUserId,
          name: mockGithubRepo.name,
          fullName: mockGithubRepo.full_name,
          githubId: mockGithubRepo.id,
          htmlUrl: mockGithubRepo.html_url,
          isPrivate: mockGithubRepo.private,
        },
      });
    });

    it('should throw BadRequestException on GitHub API error', async () => {
      const mockOctokit = {
        users: {
          getAuthenticated: jest
            .fn()
            .mockRejectedValue(new Error('GitHub API Error')),
        },
        repos: {
          get: jest.fn(),
          createForAuthenticatedUser: jest.fn(),
        },
      };

      jest
        .spyOn(require('@octokit/rest'), 'Octokit')
        .mockImplementation(() => mockOctokit);

      tokenService.getGitHubTokenForUser.mockResolvedValue(mockToken);
      prisma.user.findUnique.mockResolvedValue(mockDbUser);

      await expect(service.createOrGetRepository(mockUserId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle non-404 GitHub errors correctly', async () => {
      const mockOctokit = {
        users: {
          getAuthenticated: jest.fn().mockResolvedValue({
            data: { login: mockGithubUsername },
          }),
        },
        repos: {
          get: jest
            .fn()
            .mockRejectedValue({ status: 403, message: 'Forbidden' }),
          createForAuthenticatedUser: jest.fn(),
        },
      };

      jest
        .spyOn(require('@octokit/rest'), 'Octokit')
        .mockImplementation(() => mockOctokit);

      tokenService.getGitHubTokenForUser.mockResolvedValue(mockToken);
      prisma.user.findUnique.mockResolvedValue(mockDbUser);

      await expect(service.createOrGetRepository(mockUserId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('Configuration', () => {
    it('should use default repo name from config', () => {
      expect(configService.get).toHaveBeenCalledWith(
        'GITHUB_DEFAULT_REPO_NAME',
        'gitcode-solutions',
      );
    });

    it('should use default repo description from config', () => {
      expect(configService.get).toHaveBeenCalledWith(
        'GITHUB_DEFAULT_REPO_DESCRIPTION',
        'Repository for GitCode.dev user solutions',
      );
    });
  });
});
