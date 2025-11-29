import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from './prisma';

describe('Prisma', () => {
  let provider: Prisma;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Prisma],
    }).compile();

    provider = module.get<Prisma>(Prisma);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
