import { Test, TestingModule } from '@nestjs/testing';
import { CommitConsumer } from './commit.consumer';
import { CommitService } from './commit.service';
import { ReadmeGeneratedEnvelope } from '../events/envelopes';
import { Logger } from '@nestjs/common';

describe('CommitConsumer', () => {
  let consumer: CommitConsumer;
  let commitService: jest.Mocked<CommitService>;

  const mockPayload: ReadmeGeneratedEnvelope = {
    pattern: 'ai.readme.generated',
    data: {
      userId: 'user-123',
      readmeContent: '# My Great Solutions\n\nThis is auto-generated README',
    },
    payload: {
      userId: 'user-123',
      readmeContent: '# My Great Solutions\n\nThis is auto-generated README',
    },
  } as unknown as ReadmeGeneratedEnvelope;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommitConsumer],
      providers: [
        {
          provide: CommitService,
          useValue: {
            updateReadme: jest.fn(),
          },
        },
      ],
    }).compile();

    consumer = module.get<CommitConsumer>(CommitConsumer);
    commitService = module.get(CommitService) as jest.Mocked<CommitService>;
  });

  describe('Initialization', () => {
    it('should be defined', () => {
      expect(consumer).toBeDefined();
    });
  });

  describe('handleReadmeGenerated', () => {
    it('should call commitService.updateReadme with correct parameters', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'log');

      await consumer.handleReadmeGenerated(mockPayload);

      expect(commitService.updateReadme).toHaveBeenCalledWith(
        mockPayload.payload.userId,
        mockPayload.payload.readmeContent,
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        `Readme generated event received: ${mockPayload.payload.userId}`,
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        `Readme updated for user: ${mockPayload.payload.userId}`,
      );
    });

    it('should handle errors from commitService gracefully', async () => {
      const error = new Error('GitHub API timeout');
      commitService.updateReadme.mockImplementation(() => {
        throw error;
      });
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');
      
      await expect(
        consumer.handleReadmeGenerated(mockPayload),
      ).resolves.not.toThrow();

      expect(commitService.updateReadme).toHaveBeenCalledWith(
        mockPayload.payload.userId,
        mockPayload.payload.readmeContent,
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        `Failed to update readme: ${error.message}`,
      );
    });

    it('should handle async errors from commitService gracefully', async () => {
      const error = new Error('Async GitHub API Error');
      commitService.updateReadme.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');

      await expect(
        consumer.handleReadmeGenerated(mockPayload),
      ).resolves.not.toThrow();

      expect(commitService.updateReadme).toHaveBeenCalledWith(
        mockPayload.payload.userId,
        mockPayload.payload.readmeContent,
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        `Failed to update readme: ${error.message}`,
      );
    });
  });
});
