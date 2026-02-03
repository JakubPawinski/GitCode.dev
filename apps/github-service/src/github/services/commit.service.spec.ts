import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CommitService } from './commit.service';
import { GithubTokenService } from './github-token.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBus } from '../../../../../packages/messaging/src/lib/event-bus.service';

describe('CommitService', () => {
  let service: CommitService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommitService,
        {
          provide: GithubTokenService,
          useValue: {
            getOctokit: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            repository: {},
            commit: {},
            user: {},
            readmeGeneration: {},
          },
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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
