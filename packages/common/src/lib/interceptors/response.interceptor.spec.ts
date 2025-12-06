import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';
import { ApiResponseDto } from '../dtos/api-response.dto';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor<any>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResponseInterceptor],
    }).compile();

    interceptor = module.get<ResponseInterceptor<any>>(ResponseInterceptor);
  });

  it('should transform response with data and message', (done) => {
    const mockRequest = { url: '/test' };
    const mockResponse = { statusCode: 200 };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as ExecutionContext;

    const mockData = {
      data: 'test data',
      message: 'Custom message',
      meta: { total: 10 },
    };
    const mockCallHandler = {
      handle: () => of(mockData),
    } as CallHandler;

    interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        statusCode: 200,
        message: 'Custom message',
        data: 'test data',
        meta: { total: 10 },
        timestamp: expect.any(String),
        path: '/test',
      } as ApiResponseDto<any>);
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO string format
      done();
    });
  });

  it('should transform response with default message if no message provided', (done) => {
    const mockRequest = { url: '/api/users' };
    const mockResponse = { statusCode: 201 };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as ExecutionContext;

    const mockData = { data: { id: 1, name: 'User' } };
    const mockCallHandler = {
      handle: () => of(mockData),
    } as CallHandler;

    interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        statusCode: 201,
        message: 'Operation successful',
        data: { id: 1, name: 'User' },
        meta: undefined,
        timestamp: expect.any(String),
        path: '/api/users',
      } as ApiResponseDto<any>);
      done();
    });
  });

  it('should handle response with no data property', (done) => {
    const mockRequest = { url: '/health' };
    const mockResponse = { statusCode: 200 };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as ExecutionContext;

    const mockData = 'OK';
    const mockCallHandler = {
      handle: () => of(mockData),
    } as CallHandler;

    interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        statusCode: 200,
        message: 'Operation successful',
        data: 'OK',
        meta: undefined,
        timestamp: expect.any(String),
        path: '/health',
      } as ApiResponseDto<any>);
      done();
    });
  });
});
