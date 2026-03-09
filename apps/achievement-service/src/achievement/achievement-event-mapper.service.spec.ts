import { Test, TestingModule } from '@nestjs/testing';
import { AchievementEventMapperService } from './achievement-event-mapper.service';

describe('AchievementEventMapperService', () => {
  let service: AchievementEventMapperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AchievementEventMapperService],
    }).compile();

    service = module.get<AchievementEventMapperService>(
      AchievementEventMapperService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
