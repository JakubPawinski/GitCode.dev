import { Test, TestingModule } from '@nestjs/testing';
import { UserConsumer } from './user.consumer';
import { PrismaService } from '../prisma/prisma.service';
import { UserCreatedEnvelope } from './events/envelopes';
import { Logger } from '@nestjs/common';

describe('UserConsumer', () => {
  let consumer: UserConsumer;
  let prisma: any;

  const mockEvent: UserCreatedEnvelope = {
    pattern: 'auth.user.created',
    data: {
      userId: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      createdAt: '2026-03-22T00:00:00Z',
    },
    payload: {
      userId: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      createdAt: '2026-03-22T00:00:00Z',
    },
  } as unknown as UserCreatedEnvelope;

  beforeEach(async () => {
    const prismaServiceMock = {
      user: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserConsumer],
      providers: [
        {
          provide: PrismaService,
          useValue: prismaServiceMock,
        },
      ],
    }).compile();

    consumer = module.get<UserConsumer>(UserConsumer);
    prisma = module.get(PrismaService);
  });

  describe('Initialization', () => {
    it('should be defined', () => {
      expect(consumer).toBeDefined();
    });
  });

  describe('handleUserCreated', () => {
    it('should save user to database with correct data', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'log');
      prisma.user.create.mockResolvedValue({});

      await consumer.handleUserCreated(mockEvent);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          userId: mockEvent.payload.userId,
          username: mockEvent.payload.username,
          email: mockEvent.payload.email,
          tier: 'FREE',
        },
      });

      expect(loggerSpy).toHaveBeenCalledWith(
        `User created event received: ${mockEvent.payload.userId}`,
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        `User ${mockEvent.payload.userId} synced to github-service database`,
      );
    });

    it('should handle database errors gracefully without throwing', async () => {
      const error = new Error('Unique constraint failed');
      prisma.user.create.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');

      await expect(
        consumer.handleUserCreated(mockEvent),
      ).resolves.not.toThrow();

      expect(prisma.user.create).toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalledWith(
        `Failed to sync user: ${error.message}`,
      );
    });
  });
});
