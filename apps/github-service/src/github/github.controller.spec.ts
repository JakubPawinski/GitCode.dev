import { Test, TestingModule } from '@nestjs/testing';
import { GithubController } from './github.controller';
import { RepositoryService } from './services/repository.service';
import { CommitService } from './services/commit.service';
import { CommitChangesDto } from './dto';
import {
  RepositoryResponseDto,
  CommitResponseDto,
} from './dto/github-response.dto';
import type { AuthenticatedUser } from '@gitcode/types';

describe('GithubController', () => {
  let controller: GithubController;
  let repositoryService: jest.Mocked<RepositoryService>;
  let commitService: jest.Mocked<CommitService>;

  const mockUser: AuthenticatedUser = {
    id: 'user-123',
    email: 'test@example.com',
  } as AuthenticatedUser;

  const mockRepositoryResponse: RepositoryResponseDto = {
    name: 'gitcode-solutions',
    fullName: 'jakubpawinski/gitcode-solutions',
    htmlUrl: 'https://github.com/jakubpawinski/gitcode-solutions',
    isPrivate: false,
    created: true,
  };

  const mockCommitResponse: CommitResponseDto = {
    sha: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    message: 'Add solution for Two Sum problem',
    url: 'https://github.com/jakubpawinski/gitcode-solutions/commit/a1b2c3d4e5f6',
    committedAt: '2026-02-01T19:30:00Z',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GithubController],
      providers: [
        {
          provide: RepositoryService,
          useValue: {
            getRepository: jest.fn(),
            createOrGetRepository: jest.fn(),
          },
        },
        {
          provide: CommitService,
          useValue: {
            commitAndPushFiles: jest.fn(),
            handleReadmeUpdate: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<GithubController>(GithubController);
    repositoryService = module.get(
      RepositoryService,
    ) as jest.Mocked<RepositoryService>;
    commitService = module.get(CommitService) as jest.Mocked<CommitService>;
  });

  describe('getRepository', () => {
    it('should return repository when it exists', async () => {
      repositoryService.getRepository.mockResolvedValue(mockRepositoryResponse);

      const result = await controller.getRepository(mockUser);

      expect(result).toEqual(mockRepositoryResponse);
      expect(repositoryService.getRepository).toHaveBeenCalledWith(mockUser.id);
      expect(repositoryService.getRepository).toHaveBeenCalledTimes(1);
    });

    it('should return void when repository does not exist', async () => {
      repositoryService.getRepository.mockResolvedValue(undefined);

      const result = await controller.getRepository(mockUser);

      expect(result).toBeUndefined();
      expect(repositoryService.getRepository).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('createRepository', () => {
    it('should create and return repository', async () => {
      repositoryService.createOrGetRepository.mockResolvedValue(
        mockRepositoryResponse,
      );

      const result = await controller.createRepository(mockUser);

      expect(result).toEqual(mockRepositoryResponse);
      expect(repositoryService.createOrGetRepository).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(repositoryService.createOrGetRepository).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when creating repository', async () => {
      const error = new Error('GitHub API error');
      repositoryService.createOrGetRepository.mockRejectedValue(error);

      await expect(controller.createRepository(mockUser)).rejects.toThrow(
        'GitHub API error',
      );
    });
  });

  describe('commitChanges', () => {
    const commitDto: CommitChangesDto = {
      files: [{ path: 'solution.ts', content: 'export const solution = 1;' }],
      message: 'Solution for problem #1',
      branch: 'main',
      submissionId: 'submission-123',
    } as CommitChangesDto;

    it('should commit and push files with provided branch', async () => {
      commitService.commitAndPushFiles.mockResolvedValue(mockCommitResponse);

      const result = await controller.commitChanges(mockUser, commitDto);

      expect(result).toEqual(mockCommitResponse);
      expect(commitService.commitAndPushFiles).toHaveBeenCalledWith(
        mockUser.id,
        commitDto.files,
        commitDto.message,
        'main',
        'submission-123',
      );
    });

    it('should use default branch "main" when branch is not provided', async () => {
      const dtoWithoutBranch: CommitChangesDto = {
        ...commitDto,
        branch: undefined,
      } as CommitChangesDto;

      commitService.commitAndPushFiles.mockResolvedValue(mockCommitResponse);

      await controller.commitChanges(mockUser, dtoWithoutBranch);

      expect(commitService.commitAndPushFiles).toHaveBeenCalledWith(
        mockUser.id,
        dtoWithoutBranch.files,
        dtoWithoutBranch.message,
        'main',
        'submission-123',
      );
    });

    it('should handle multiple files in single commit', async () => {
      const dtoWithMultipleFiles: CommitChangesDto = {
        files: [
          { path: 'solution.ts', content: 'const x = 1;' },
          { path: 'test.spec.ts', content: 'describe(...) { }' },
          { path: 'README.md', content: '# Solution' },
        ],
        message: 'Add solution with tests and docs',
        branch: 'feature/problem-1',
        submissionId: 'submission-456',
      } as CommitChangesDto;

      commitService.commitAndPushFiles.mockResolvedValue(mockCommitResponse);

      const result = await controller.commitChanges(
        mockUser,
        dtoWithMultipleFiles,
      );

      expect(result).toEqual(mockCommitResponse);
      expect(commitService.commitAndPushFiles).toHaveBeenCalledWith(
        mockUser.id,
        dtoWithMultipleFiles.files,
        dtoWithMultipleFiles.message,
        'feature/problem-1',
        'submission-456',
      );
    });
  });

  describe('updateReadme', () => {
    it('should update README.md file', async () => {
      const readmeResponse = { message: 'README.md updated successfully' };
      commitService.handleReadmeUpdate.mockResolvedValue(readmeResponse);

      const result = await controller.updateReadme(mockUser);

      expect(result).toEqual(readmeResponse);
      expect(commitService.handleReadmeUpdate).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(commitService.handleReadmeUpdate).toHaveBeenCalledTimes(1);
    });

    it('should handle errors during README update', async () => {
      const error = new Error('File write failed');
      commitService.handleReadmeUpdate.mockRejectedValue(error);

      await expect(controller.updateReadme(mockUser)).rejects.toThrow(
        'File write failed',
      );
    });
  });

  describe('Error Handling', () => {
    it('should pass user context correctly to all service methods', async () => {
      const anotherUser: AuthenticatedUser = {
        id: 'user-456',
        email: 'another@example.com',
      } as AuthenticatedUser;

      repositoryService.getRepository.mockResolvedValue(undefined);
      commitService.handleReadmeUpdate.mockResolvedValue({
        message: 'Updated',
      });

      await controller.getRepository(anotherUser);
      await controller.updateReadme(anotherUser);

      expect(repositoryService.getRepository).toHaveBeenCalledWith('user-456');
      expect(commitService.handleReadmeUpdate).toHaveBeenCalledWith('user-456');
    });
  });
});
