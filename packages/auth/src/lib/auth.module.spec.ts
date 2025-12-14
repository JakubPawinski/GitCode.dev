import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GitCodeAuthModule } from './auth.module';

describe('GitCodeAuthModule', () => {
  it('should compile', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [GitCodeAuthModule],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn().mockReturnValue('test-secret'),
      })
      .compile();

    expect(module).toBeDefined();
  });
});
