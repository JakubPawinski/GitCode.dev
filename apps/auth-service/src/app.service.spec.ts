import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return health status', () => {
    const result = service.getHealth();
    expect(result).toEqual({ status: 'Auth Service is healthy' });
  });

  it('should return hello message', () => {
    const result = service.getHello();
    expect(result).toBe('Hello from Auth Service!');
  });
});
