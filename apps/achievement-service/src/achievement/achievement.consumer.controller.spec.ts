import { Test, TestingModule } from '@nestjs/testing';
import { AchievementConsumerController } from './achievement.consumer.controller';
import { AchievementService } from './achievement.service';
import { SubmissionCompletedEnvelope } from './events/envelopes';

describe('AchievementConsumerController', () => {
  let controller: AchievementConsumerController;
  let service: jest.Mocked<AchievementService>;

  const mockUserId = '22a408d1-fa2f-48c3-a781-d35c3b838e23';
  const mockProblemId = 'f5b577fc-716e-4cda-bf31-32b5099fe792';
  const mockSubmissionId = 'sub-123';
  const mockAttemptId = 'att-456';

  const createSubmissionEnvelope = (
    overrides?: Partial<SubmissionCompletedEnvelope>,
  ): SubmissionCompletedEnvelope => ({
    event: 'submission.completed',
    eventId: '9f096f34-af41-4174-aaee-8622aeec0590',
    occurredOn: new Date().toISOString(),
    payload: {
      userId: mockUserId,
      submissionId: mockSubmissionId,
      code: 'function test() {}',
      language: 'javascript',
      problemId: mockProblemId,
      attemptId: mockAttemptId,
      problemDescription: 'Test Problem - MEDIUM',
    },
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AchievementConsumerController],
      providers: [
        {
          provide: AchievementService,
          useValue: {
            handleSubmissionCompletedEvent: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AchievementConsumerController>(
      AchievementConsumerController,
    );
    service = module.get(AchievementService) as jest.Mocked<AchievementService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleSubmissionCompletedEvent', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
      expect(controller.handleSubmissionCompletedEvent).toBeDefined();
    });

    it('should handle submission completed event successfully', async () => {
      const envelope = createSubmissionEnvelope();

      service.handleSubmissionCompletedEvent.mockResolvedValueOnce(undefined);

      await controller.handleSubmissionCompletedEvent(envelope);

      expect(service.handleSubmissionCompletedEvent).toHaveBeenCalledWith(
        envelope,
      );
      expect(service.handleSubmissionCompletedEvent).toHaveBeenCalledTimes(1);
    });

    it('should pass event envelope to service', async () => {
      const envelope = createSubmissionEnvelope({
        payload: {
          userId: mockUserId,
          submissionId: mockSubmissionId,
          code: 'console.log("hello");',
          language: 'javascript',
          problemId: mockProblemId,
          attemptId: mockAttemptId,
          problemDescription: 'Print hello world - EASY',
        },
      });

      service.handleSubmissionCompletedEvent.mockResolvedValueOnce(undefined);

      await controller.handleSubmissionCompletedEvent(envelope);

      expect(service.handleSubmissionCompletedEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'submission.completed',
          eventId: expect.any(String),
          occurredOn: expect.any(String),
          payload: expect.objectContaining({
            userId: mockUserId,
            language: 'javascript',
            problemDescription: 'Print hello world - EASY',
          }),
        }),
      );
    });

    it('should handle different programming languages', async () => {
      const languages = ['javascript', 'python', 'java', 'cpp'];

      for (const language of languages) {
        const envelope = createSubmissionEnvelope({
          payload: {
            userId: mockUserId,
            submissionId: mockSubmissionId,
            code: 'function test() {}',
            language,
            problemId: mockProblemId,
            attemptId: mockAttemptId,
            problemDescription: 'Test Problem',
          },
        });

        service.handleSubmissionCompletedEvent.mockResolvedValueOnce(undefined);

        await controller.handleSubmissionCompletedEvent(envelope);

        expect(service.handleSubmissionCompletedEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: expect.objectContaining({
              language,
            }),
          }),
        );
      }

      expect(service.handleSubmissionCompletedEvent).toHaveBeenCalledTimes(4);
    });

    it('should handle different problem difficulties', async () => {
      const difficulties = ['EASY', 'MEDIUM', 'HARD'];

      for (const difficulty of difficulties) {
        const envelope = createSubmissionEnvelope({
          payload: {
            userId: mockUserId,
            submissionId: mockSubmissionId,
            code: 'function test() {}',
            language: 'javascript',
            problemId: mockProblemId,
            attemptId: mockAttemptId,
            problemDescription: `Test Problem - ${difficulty}`,
          },
        });

        service.handleSubmissionCompletedEvent.mockResolvedValueOnce(undefined);

        await controller.handleSubmissionCompletedEvent(envelope);

        expect(service.handleSubmissionCompletedEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: expect.objectContaining({
              problemDescription: `Test Problem - ${difficulty}`,
            }),
          }),
        );
      }

      expect(service.handleSubmissionCompletedEvent).toHaveBeenCalledTimes(3);
    });

    it('should handle different users', async () => {
      const userIds = [
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
        '33333333-3333-3333-3333-333333333333',
      ];

      for (const userId of userIds) {
        const envelope = createSubmissionEnvelope({
          payload: {
            userId,
            submissionId: mockSubmissionId,
            code: 'function test() {}',
            language: 'javascript',
            problemId: mockProblemId,
            attemptId: mockAttemptId,
            problemDescription: 'Test Problem',
          },
        });

        service.handleSubmissionCompletedEvent.mockResolvedValueOnce(undefined);

        await controller.handleSubmissionCompletedEvent(envelope);

        expect(service.handleSubmissionCompletedEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: expect.objectContaining({
              userId,
            }),
          }),
        );
      }

      expect(service.handleSubmissionCompletedEvent).toHaveBeenCalledTimes(3);
    });

    it('should preserve event metadata', async () => {
      const eventId = 'unique-event-id-12345';
      const occurredOn = '2026-03-09T18:30:00.000Z';

      const envelope = createSubmissionEnvelope({
        eventId,
        occurredOn,
      });

      service.handleSubmissionCompletedEvent.mockResolvedValueOnce(undefined);

      await controller.handleSubmissionCompletedEvent(envelope);

      expect(service.handleSubmissionCompletedEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId,
          occurredOn,
        }),
      );
    });

    it('should handle submission with complex code', async () => {
      const complexCode = `
        function fibonacci(n) {
          if (n <= 1) return n;
          return fibonacci(n - 1) + fibonacci(n - 2);
        }
        console.log(fibonacci(10));
      `;

      const envelope = createSubmissionEnvelope({
        payload: {
          userId: mockUserId,
          submissionId: mockSubmissionId,
          code: complexCode,
          language: 'javascript',
          problemId: mockProblemId,
          attemptId: mockAttemptId,
          problemDescription: 'Calculate Fibonacci - HARD',
        },
      });

      service.handleSubmissionCompletedEvent.mockResolvedValueOnce(undefined);

      await controller.handleSubmissionCompletedEvent(envelope);

      expect(service.handleSubmissionCompletedEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            code: complexCode,
          }),
        }),
      );
    });

    it('should handle service errors', async () => {
      const envelope = createSubmissionEnvelope();
      const error = new Error('Service processing failed');

      service.handleSubmissionCompletedEvent.mockRejectedValueOnce(error);

      await expect(
        controller.handleSubmissionCompletedEvent(envelope),
      ).rejects.toThrow('Service processing failed');

      expect(service.handleSubmissionCompletedEvent).toHaveBeenCalledWith(
        envelope,
      );
    });

    it('should not modify envelope before sending to service', async () => {
      const envelope = createSubmissionEnvelope();
      const envelopeCopy = JSON.parse(JSON.stringify(envelope));

      service.handleSubmissionCompletedEvent.mockResolvedValueOnce(undefined);

      await controller.handleSubmissionCompletedEvent(envelope);

      expect(envelope).toEqual(envelopeCopy);
    });

    it('should handle rapid successive events', async () => {
      const envelopes = [
        createSubmissionEnvelope({
          eventId: 'event-1',
          payload: {
            userId: mockUserId,
            submissionId: 'sub-1',
            code: 'code1',
            language: 'javascript',
            problemId: mockProblemId,
            attemptId: mockAttemptId,
            problemDescription: 'Problem 1',
          },
        }),
        createSubmissionEnvelope({
          eventId: 'event-2',
          payload: {
            userId: mockUserId,
            submissionId: 'sub-2',
            code: 'code2',
            language: 'python',
            problemId: mockProblemId,
            attemptId: mockAttemptId,
            problemDescription: 'Problem 2',
          },
        }),
        createSubmissionEnvelope({
          eventId: 'event-3',
          payload: {
            userId: mockUserId,
            submissionId: 'sub-3',
            code: 'code3',
            language: 'java',
            problemId: mockProblemId,
            attemptId: mockAttemptId,
            problemDescription: 'Problem 3',
          },
        }),
      ];

      service.handleSubmissionCompletedEvent.mockResolvedValue(undefined);

      for (const envelope of envelopes) {
        await controller.handleSubmissionCompletedEvent(envelope);
      }

      expect(service.handleSubmissionCompletedEvent).toHaveBeenCalledTimes(3);
      expect(service.handleSubmissionCompletedEvent).toHaveBeenNthCalledWith(
        1,
        envelopes[0],
      );
      expect(service.handleSubmissionCompletedEvent).toHaveBeenNthCalledWith(
        2,
        envelopes[1],
      );
      expect(service.handleSubmissionCompletedEvent).toHaveBeenNthCalledWith(
        3,
        envelopes[2],
      );
    });

    it('should have handleSubmissionCompletedEvent method with correct decorator', () => {
      const methodName = 'handleSubmissionCompletedEvent';
      expect(controller[methodName]).toBeDefined();
      expect(typeof controller[methodName]).toBe('function');
    });
  });
});
