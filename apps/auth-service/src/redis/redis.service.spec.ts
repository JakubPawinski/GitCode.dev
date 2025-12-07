import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
import { createClient, RedisClientType } from 'redis';

jest.mock('redis', () => ({
  createClient: jest.fn(),
}));

describe('RedisService', () => {
  let service: RedisService;
  let configService: jest.Mocked<ConfigService>;
  let mockClient: jest.Mocked<RedisClientType>;

  beforeEach(async () => {
    mockClient = {
      connect: jest.fn().mockResolvedValue(undefined),
      quit: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockResolvedValue('OK'),
      setEx: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue('value'),
      del: jest.fn().mockResolvedValue(1),
      exists: jest.fn().mockResolvedValue(1),
      on: jest.fn(),
    } as any;

    (createClient as jest.Mock).mockReturnValue(mockClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('redis://localhost:6379'),
          },
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
    configService = module.get(ConfigService);

    await service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize Redis client and connect', async () => {
      await service.onModuleInit();

      expect(createClient).toHaveBeenCalledWith({
        url: 'redis://localhost:6379',
      });
      expect(mockClient.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockClient.connect).toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('should quit Redis client', async () => {
      await service.onModuleDestroy();

      expect(mockClient.quit).toHaveBeenCalled();
    });
  });

  describe('set', () => {
    it('should set value without TTL', async () => {
      await service.set('key', 'value');

      expect(mockClient.set).toHaveBeenCalledWith('key', 'value');
    });

    it('should set value with TTL', async () => {
      await service.set('key', 'value', 300);

      expect(mockClient.setEx).toHaveBeenCalledWith('key', 300, 'value');
    });
  });

  describe('get', () => {
    it('should get value', async () => {
      mockClient.get.mockResolvedValue('test-value');

      const result = await service.get('key');

      expect(result).toBe('test-value');
      expect(mockClient.get).toHaveBeenCalledWith('key');
    });

    it('should return null if key not found', async () => {
      mockClient.get.mockResolvedValue(null);

      const result = await service.get('key');

      expect(result).toBeNull();
    });
  });

  describe('del', () => {
    it('should delete key', async () => {
      await service.del('key');

      expect(mockClient.del).toHaveBeenCalledWith('key');
    });
  });

  describe('exists', () => {
    it('should return true if key exists', async () => {
      mockClient.exists.mockResolvedValue(1);

      const result = await service.exists('key');

      expect(result).toBe(true);
      expect(mockClient.exists).toHaveBeenCalledWith('key');
    });

    it('should return false if key does not exist', async () => {
      mockClient.exists.mockResolvedValue(0);

      const result = await service.exists('key');

      expect(result).toBe(false);
    });
  });
});
