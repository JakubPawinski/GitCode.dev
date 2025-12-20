import { Test, TestingModule } from '@nestjs/testing';
import { MessagingModule } from './messaging.module';
import { EventBus } from './event-bus.service';

describe('MessagingModule', () => {
  let module: TestingModule;

  afterEach(async () => {
    await module.close();
  });

  describe('forRoot', () => {
    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [MessagingModule.forRoot(['amqp://localhost:5672'])],
      }).compile();
    });

    it('should compile the module', () => {
      expect(module).toBeDefined();
    });

    it('should provide EventBus', () => {
      const eventBus = module.get<EventBus>(EventBus);
      expect(eventBus).toBeDefined();
      expect(eventBus).toBeInstanceOf(EventBus);
    });

    it('should export EventBus', () => {
      const eventBus = module.get<EventBus>(EventBus);
      expect(eventBus).toBeDefined();
    });
  });
});
