import { Test, TestingModule } from '@nestjs/testing';
import { GithubModule } from './github.module';
import { GithubController } from './github.controller';
import { GithubTokenService } from './services/github-token.service';
import { RepositoryService } from './services/repository.service';
import { CommitService } from './services/commit.service';
import { UserConsumer } from './user.consumer';
import { CommitConsumer } from './services/commit.consumer';

describe('GithubModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [GithubModule],
    })
      .overrideProvider(GithubTokenService)
      .useValue({})
      .overrideProvider(RepositoryService)
      .useValue({})
      .overrideProvider(CommitService)
      .useValue({})
      .compile();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('Module Structure', () => {
    it('should be defined', () => {
      expect(module).toBeDefined();
    });

    it('should compile successfully', () => {
      expect(module).toBeDefined();
    });
  });

  describe('Controllers', () => {
    it('should have GithubController registered', () => {
      const controller = module.get<GithubController>(GithubController);
      expect(controller).toBeDefined();
    });

    it('should have UserConsumer registered', () => {
      const consumer = module.get<UserConsumer>(UserConsumer);
      expect(consumer).toBeDefined();
    });

    it('should have CommitConsumer registered', () => {
      const consumer = module.get<CommitConsumer>(CommitConsumer);
      expect(consumer).toBeDefined();
    });
  });

  describe('Providers', () => {
    it('should have GithubTokenService available', () => {
      const service = module.get<GithubTokenService>(GithubTokenService);
      expect(service).toBeDefined();
    });

    it('should have RepositoryService available', () => {
      const service = module.get<RepositoryService>(RepositoryService);
      expect(service).toBeDefined();
    });

    it('should have CommitService available', () => {
      const service = module.get<CommitService>(CommitService);
      expect(service).toBeDefined();
    });
  });
});
