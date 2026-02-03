import { Test, TestingModule } from '@nestjs/testing';
import { GithubController } from './github.controller';
import { GithubService } from './github.service';
import { RepositoryService } from './services/repository.service';
import { CommitService } from './services/commit.service';

describe('GithubController', () => {
  let controller: GithubController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GithubController],
      providers: [
        GithubService,
        {
          provide: RepositoryService,
          useValue: {
            createOrGetRepository: jest.fn(),
          },
        },
        {
          provide: CommitService,
          useValue: {
            commitAndPushFiles: jest.fn(),
            updateReadme: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<GithubController>(GithubController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
