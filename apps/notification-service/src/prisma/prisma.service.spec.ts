import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

const mockConnect = jest.fn().mockResolvedValue(true);
const mockDisconnect = jest.fn().mockResolvedValue(true);

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    end: jest.fn().mockResolvedValue(true),
  })),
}));

jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@prisma/client-notification', () => ({
  PrismaClient: class {
    $connect = mockConnect;
    $disconnect = mockDisconnect;
  },
}));

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should connect to the database', async () => {
      await service.onModuleInit();
      expect(service.$connect).toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect from the database and end the pool', async () => {
      await service.onModuleDestroy();
      expect(service.$disconnect).toHaveBeenCalled();
      expect((service as any).pool.end).toHaveBeenCalled();
    });
  });
});
