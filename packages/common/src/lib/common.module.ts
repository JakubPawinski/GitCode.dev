import { Module } from '@nestjs/common';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { HttpExceptionFilter } from './filters/http-exception.filter';

@Module({
  controllers: [],
  providers: [ResponseInterceptor, HttpExceptionFilter],
  exports: [ResponseInterceptor, HttpExceptionFilter],
})
export class GitCodeCommonModule {}
