import { Test, TestingModule } from '@nestjs/testing';
import { GithubTokenService } from './github-token.service';

describe('GithubTokenService', () => {
  let service: GithubTokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GithubTokenService],
    }).compile();

    service = module.get<GithubTokenService>(GithubTokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
