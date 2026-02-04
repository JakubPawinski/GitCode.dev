import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { GithubTokenService } from './github-token.service';
import { of } from 'rxjs';

describe('GithubTokenService', () => {
  let service: GithubTokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GithubTokenService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(() => of({})),
            post: jest.fn(() => of({})),
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

    service = module.get<GithubTokenService>(GithubTokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
