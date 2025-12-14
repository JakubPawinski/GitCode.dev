import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisModule } from './redis.module';
import { RedisService } from './redis.service';
import { createClient } from 'redis';

jest.mock('redis', () => ({
  createClient: jest.fn().mockReturnValue({
    connect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
  }),
}));

describe('RedisModule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should compile', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [RedisModule],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn().mockReturnValue('redis://localhost:6379'),
      })
      .compile();

    expect(module).toBeDefined();
  });

  it('should export RedisService', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [RedisModule],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn().mockReturnValue('redis://localhost:6379'),
      })
      .compile();

    const redisService = module.get<RedisService>(RedisService);
    expect(redisService).toBeDefined();
    expect(redisService).toBeInstanceOf(RedisService);
  });

  it('should initialize RedisService on module init', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [RedisModule],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn().mockReturnValue('redis://localhost:6379'),
      })
      .compile();

    const redisService = module.get<RedisService>(RedisService);
    await redisService.onModuleInit();

    expect(createClient).toHaveBeenCalledWith({
      url: 'redis://localhost:6379',
    });
  });
});
