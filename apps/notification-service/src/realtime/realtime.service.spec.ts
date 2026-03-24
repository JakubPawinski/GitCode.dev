import { Test, TestingModule } from '@nestjs/testing';
import { RealtimeService } from './realtime.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

jest.mock('ioredis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => {
      let messageHandler: Function;
      return {
        subscribe: jest.fn().mockResolvedValue(1),
        on: jest.fn((event, handler) => {
          if (event === 'message') {
            messageHandler = handler;
          }
        }),
        publish: jest.fn().mockResolvedValue(1),
        quit: jest.fn().mockResolvedValue('OK'),
        // Helper to trigger message mock
        emitMessage: (channel: string, message: string) => {
          if (messageHandler) {
            messageHandler(channel, message);
          }
        },
      };
    }),
  };
});

describe('RealtimeService', () => {
  let service: RealtimeService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealtimeService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('redis://mock:6379'),
          },
        },
      ],
    }).compile();

    service = module.get<RealtimeService>(RealtimeService);
    configService = module.get<ConfigService>(ConfigService);

    // Suppress logs during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize redis and subscribe to global_notifications', async () => {
      await service.onModuleInit();
      expect(configService.get).toHaveBeenCalledWith('redis.url');
      expect((service as any).subscriber.subscribe).toHaveBeenCalledWith(
        'global_notifications',
      );
      expect((service as any).subscriber.on).toHaveBeenCalledWith(
        'message',
        expect.any(Function),
      );
    });
  });

  describe('onModuleDestroy', () => {
    it('should quit redis connections', async () => {
      await service.onModuleInit(); // need to init to create publisher and subscriber
      await service.onModuleDestroy();
      expect((service as any).subscriber.quit).toHaveBeenCalled();
      expect((service as any).publisher.quit).toHaveBeenCalled();
    });
  });

  describe('broadcastEvent', () => {
    it('should publish event to redis', async () => {
      await service.onModuleInit();
      const payload = { message: 'hello test' };
      await service.broadcastEvent('user_123', 'notification', payload);

      const expectedEventInfo = JSON.stringify({
        userId: 'user_123',
        type: 'notification',
        payload,
      });

      expect((service as any).publisher.publish).toHaveBeenCalledWith(
        'global_notifications',
        expectedEventInfo,
      );
    });
  });

  describe('getUserStream', () => {
    it('should emit events correctly for the specific user', (done) => {
      service.onModuleInit().then(() => {
        const stream$ = service.getUserStream('user_123');
        const payloadData = { test: 'data' };

        stream$.subscribe((event) => {
          expect(event.data).toEqual(payloadData);
          done();
        });

        const subscriberMock = (service as any).subscriber;
        // Simulate an incoming redis message
        const messageStr = JSON.stringify({
          userId: 'user_123',
          type: 'notification',
          payload: payloadData,
        });

        subscriberMock.emitMessage('global_notifications', messageStr);
      });
    });

    it('should filter out events for other users', (done) => {
      let emitted = false;

      service.onModuleInit().then(() => {
        const stream$ = service.getUserStream('user_123');

        stream$.subscribe(() => {
          emitted = true;
        });

        const subscriberMock = (service as any).subscriber;
        // Simulate an incoming redis message for another user
        const messageStr = JSON.stringify({
          userId: 'user_456',
          type: 'notification',
          payload: {},
        });

        subscriberMock.emitMessage('global_notifications', messageStr);

        setTimeout(() => {
          expect(emitted).toBe(false);
          done();
        }, 50);
      });
    });
  });
});
