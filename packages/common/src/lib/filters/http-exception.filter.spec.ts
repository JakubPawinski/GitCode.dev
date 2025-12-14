import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import { Request, Response } from 'express';
import { HttpExceptionFilter } from './http-exception.filter';
import { ApiResponseDto } from '../dtos/api-response.dto';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HttpExceptionFilter],
    }).compile();

    filter = module.get<HttpExceptionFilter>(HttpExceptionFilter);
  });

  it('should handle HttpException with string message', () => {
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;
    const mockRequest = { url: '/test' } as Request;
    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as ArgumentsHost;

    const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);
    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Test error',
        data: null,
        error: expect.objectContaining({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Test error',
        }),
        path: '/test',
      } as ApiResponseDto<null>),
    );
  });

  it('should handle HttpException with object response', () => {
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;
    const mockRequest = { url: '/test' } as Request;
    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as ArgumentsHost;

    const exception = new HttpException(
      {
        message: 'Custom message',
        error: 'CUSTOM_ERROR',
        details: { key: 'value' },
      },
      HttpStatus.UNAUTHORIZED,
    );
    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Custom message',
        data: null,
        error: expect.objectContaining({
          code: 'CUSTOM_ERROR',
          message: 'Custom message',
          details: { key: 'value' },
        }),
        path: '/test',
      } as ApiResponseDto<null>),
    );
  });

  it('should handle generic Error', () => {
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;
    const mockRequest = { url: '/test' } as Request;
    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as ArgumentsHost;

    const exception = new Error('Generic error');
    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Generic error',
        data: null,
        error: expect.objectContaining({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Generic error',
        }),
        path: '/test',
      } as ApiResponseDto<null>),
    );
  });

  it('should handle unknown exception', () => {
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;
    const mockRequest = { url: '/test' } as Request;
    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as ArgumentsHost;

    const exception = 'Unknown error';
    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        data: null,
        error: expect.objectContaining({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        }),
        path: '/test',
      } as ApiResponseDto<null>),
    );
  });
});
