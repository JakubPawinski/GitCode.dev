import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import { Request, Response } from 'express';
import { HttpExceptionFilter } from './http-exception.filter';
import { ApiResponseDto } from '../dtos/api-response.dto';

// Mock PrismaExceptionMapper
jest.mock('../exceptions/prisma-exception.mapper', () => ({
  PrismaExceptionMapper: {
    map: jest.fn(() => null),
  },
}));

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    // Tworz filtr bezpośrednio bez TestingModule
    filter = new HttpExceptionFilter('test-service');
  });

  it('should handle HttpException with string message', () => {
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;
    const mockRequest = {
      url: '/test',
      headers: {},
      method: 'GET',
    } as any as Request;
    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as any as ArgumentsHost;

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
          code: 'BAD_REQUEST',
          message: 'Test error',
          service: 'test-service',
        }),
        path: '/test',
      }),
    );
  });

  it('should handle HttpException with object response', () => {
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;
    const mockRequest = {
      url: '/test',
      headers: {},
      method: 'POST',
    } as any as Request;
    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as any as ArgumentsHost;

    const exception = new HttpException(
      {
        message: 'Custom message',
        error: 'CUSTOM_ERROR',
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
          service: 'test-service',
        }),
        path: '/test',
      }),
    );
  });

  it('should handle generic Error', () => {
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;
    const mockRequest = {
      url: '/test',
      headers: {},
      method: 'GET',
    } as any as Request;
    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as any as ArgumentsHost;

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
          service: 'test-service',
        }),
        path: '/test',
      }),
    );
  });

  it('should handle unknown exception', () => {
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;
    const mockRequest = {
      url: '/test',
      headers: {},
      method: 'GET',
    } as any as Request;
    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as any as ArgumentsHost;

    const exception = 'Unknown error';
    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        data: null,
        error: expect.objectContaining({
          code: 'INTERNAL_SERVER_ERROR',
          service: 'test-service',
        }),
        path: '/test',
      }),
    );
  });

  it('should include requestId when provided', () => {
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;
    const mockRequest = {
      url: '/test',
      headers: { 'x-request-id': 'req-123' },
      method: 'GET',
    } as any as Request;
    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as any as ArgumentsHost;

    const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);
    filter.catch(exception, mockHost);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          requestId: 'req-123',
        }),
      }),
    );
  });

  it('should have timestamp in ISO format', () => {
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;
    const mockRequest = {
      url: '/test',
      headers: {},
      method: 'GET',
    } as any as Request;
    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as any as ArgumentsHost;

    const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);
    filter.catch(exception, mockHost);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        timestamp: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
        ),
      }),
    );
  });
});
