import { Test, TestingModule } from '@nestjs/testing';
import { GitCodeCommonModule } from './common.module';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { HttpExceptionFilter } from './filters/http-exception.filter';

describe('GitCodeCommonModule', () => {
  it('should compile', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [GitCodeCommonModule],
    }).compile();

    expect(module).toBeDefined();
  });

  it('should export ResponseInterceptor', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [GitCodeCommonModule],
    }).compile();

    const interceptor =
      module.get<ResponseInterceptor<any>>(ResponseInterceptor);
    expect(interceptor).toBeDefined();
    expect(interceptor).toBeInstanceOf(ResponseInterceptor);
  });

  it('should export HttpExceptionFilter', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [GitCodeCommonModule],
    }).compile();

    const filter = module.get<HttpExceptionFilter>(HttpExceptionFilter);
    expect(filter).toBeDefined();
    expect(filter).toBeInstanceOf(HttpExceptionFilter);
  });
});
