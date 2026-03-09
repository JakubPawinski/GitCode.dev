import { Test, TestingModule } from '@nestjs/testing';
import { AchievementConsumerController } from './achievement.consumer.controller';

describe('AchievementConsumerController', () => {
  let controller: AchievementConsumerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AchievementConsumerController],
    }).compile();

    controller = module.get<AchievementConsumerController>(
      AchievementConsumerController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
