import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RepositoryService } from './repository.service';
import { GithubTokenService } from './github-token.service';
import { PrismaService } from '../../prisma/prisma.service';
describe('RepositoryService', () => {
  let service: RepositoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepositoryService,
        {
          provide: GithubTokenService,
          useValue: {
            getOctokit: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {},
            repository: {},
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RepositoryService>(RepositoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
