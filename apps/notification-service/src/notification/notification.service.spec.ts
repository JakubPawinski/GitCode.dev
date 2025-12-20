import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './providers/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    const mockPrismaService = {
      notificationConfig: {
        findMany: jest.fn(),
      },
      notification: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      notificationPreference: {
        findMany: jest.fn(),
        upsert: jest.fn(),
      },
    };

    const mockRealtimeService = {
      broadcastEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: RealtimeService,
          useValue: mockRealtimeService,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

});
