import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from './providers/notification.service';
import { RealtimeService } from '../realtime/realtime.service';
import { ConfigService } from '@nestjs/config';

describe('NotificationController', () => {
  let controller: NotificationController;

  beforeEach(async () => {
    const mockNotificationService = {
      getHealth: jest.fn(),
    };

    const mockRealtimeService = {
      getUserStream: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
        {
          provide: RealtimeService,
          useValue: mockRealtimeService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
