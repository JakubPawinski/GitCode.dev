import { Test, TestingModule } from '@nestjs/testing';
import { MessagingModule } from './messaging.module';
import { EventBus } from './event-bus.service';
import { DynamicModule } from '@nestjs/common';

jest.mock('@golevelup/nestjs-rabbitmq', () => ({
  RabbitMQModule: {
    forRoot: jest.fn().mockImplementation(
      () =>
        ({
          module: class MockRabbitMQModule {},
          imports: [],
          providers: [
            {
              provide: 'AmqpConnection',
              useValue: {
                channel: {
                  assertExchange: jest.fn(),
                  assertQueue: jest.fn(),
                },
              },
            },
          ],
          exports: ['AmqpConnection'],
        }) as DynamicModule,
    ),
  },
}));

describe('MessagingModule', () => {
  let module: TestingModule;

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('forRoot', () => {
    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [MessagingModule.forRoot(['amqp://localhost:5672'])],
      })
        .overrideProvider(EventBus)
        .useValue({
          publish: jest.fn(),
        })
        .compile();
    });

    it('should compile the module', () => {
      expect(module).toBeDefined();
    });

    it('should provide EventBus', () => {
      const eventBus = module.get<EventBus>(EventBus);
      expect(eventBus).toBeDefined();
    });

    it('should export EventBus', () => {
      const eventBus = module.get<EventBus>(EventBus);
      expect(eventBus).toBeDefined();
    });
  });
});
