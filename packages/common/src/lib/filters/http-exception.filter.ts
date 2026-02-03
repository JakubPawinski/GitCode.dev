import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponseDto } from '../dtos/api-response.dto';
import { BaseAppException, ErrorDetails } from '../exceptions/base.exception';
import { PrismaExceptionMapper } from '../exceptions/prisma-exception.mapper';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  private readonly serviceName: string;

  constructor(serviceName?: string) {
    this.serviceName = serviceName || process.env.SERVICE_NAME || 'unknown';
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = request.headers['x-request-id'] as string | undefined;

    // 1. Try to map Prisma errors
    const mappedException = PrismaExceptionMapper.map(exception);
    if (mappedException) {
      return this.handleAppException(
        mappedException,
        response,
        request,
        requestId,
      );
    }

    // 2. Handle custom app exceptions
    if (exception instanceof BaseAppException) {
      return this.handleAppException(exception, response, request, requestId);
    }

    // 3. Handle NestJS HttpExceptions
    if (exception instanceof HttpException) {
      return this.handleHttpException(exception, response, request, requestId);
    }

    // 4. Handle unknown errors
    return this.handleUnknownError(exception, response, request, requestId);
  }

  /**
   * Handles application-specific exceptions.
   *
   * @param exception The application exception to handle.
   * @param response The HTTP response object.
   * @param request The HTTP request object.
   * @param requestId Optional request ID for tracing.
   */
  private handleAppException(
    exception: BaseAppException,
    response: Response,
    request: Request,
    requestId?: string,
  ) {
    const status = exception.getStatus();

    const errorResponse: ApiResponseDto<null> = {
      success: false,
      statusCode: status,
      message: exception.message,
      data: null,
      error: {
        code: exception.errorCode,
        message: exception.message,
        details: exception.details,
        service: this.serviceName,
        ...(requestId && { requestId }),
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    this.logError(exception, request, status, exception.isOperational);
    response.status(status).json(errorResponse);
  }

  /**
   * Handles NestJS HttpExceptions.
   *
   * @param exception The HttpException to handle.
   * @param response The HTTP response object.
   * @param request The HTTP request object.
   * @param requestId Optional request ID for tracing.
   */
  private handleHttpException(
    exception: HttpException,
    response: Response,
    request: Request,
    requestId?: string,
  ) {
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message = 'An error occurred';
    let errorCode = this.statusToErrorCode(status);
    let details: ErrorDetails[] | undefined;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object') {
      const resp = exceptionResponse as any;
      message = resp.message || message;
      errorCode = resp.error || resp.errorCode || errorCode;

      if (Array.isArray(resp.message)) {
        message = 'Validation failed';
        errorCode = 'VALIDATION_ERROR';
        details = resp.message.map((msg: string) => ({
          code: 'VALIDATION',
          constraint: msg,
        }));
      }
    }

    const errorResponse: ApiResponseDto<null> = {
      success: false,
      statusCode: status,
      message,
      data: null,
      error: {
        code: errorCode,
        message,
        details,
        service: this.serviceName,
        ...(requestId && { requestId }),
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    this.logError(exception, request, status, true);
    response.status(status).json(errorResponse);
  }

  /**
   * Handles unknown errors that are not recognized as application or HTTP exceptions.
   *
   * @param exception The unknown exception to handle.
   * @param response The HTTP response object.
   * @param request The HTTP request object.
   * @param requestId Optional request ID for tracing.
   */
  private handleUnknownError(
    exception: unknown,
    response: Response,
    request: Request,
    requestId?: string,
  ) {
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : exception instanceof Error
          ? exception.message
          : 'Unknown error';

    const errorResponse: ApiResponseDto<null> = {
      success: false,
      statusCode: status,
      message,
      data: null,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message,
        service: this.serviceName,
        ...(requestId && { requestId }),
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    this.logError(exception, request, status, false);
    response.status(status).json(errorResponse);
  }

  /**
   * Logs error details based on whether the error is operational or not.
   *
   * @param exception The exception to log.
   * @param request The HTTP request object.
   * @param status The HTTP status code.
   * @param isOperational Indicates if the error is operational.
   */
  private logError(
    exception: unknown,
    request: Request,
    status: number,
    isOperational: boolean,
  ) {
    const logContext = {
      status,
      path: request.url,
      method: request.method,
      service: this.serviceName,
      requestId: request.headers['x-request-id'],
      stack: exception instanceof Error ? exception.stack : undefined,
    };

    if (isOperational) {
      if (status >= 500) {
        this.logger.error(
          `[${status}] ${request.method} ${request.url}`,
          logContext,
        );
      } else if (status >= 400) {
        this.logger.warn(
          `[${status}] ${request.method} ${request.url}`,
          logContext,
        );
      }
    } else {
      this.logger.error(
        `[NON-OPERATIONAL] [${status}] ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }
  }

  /**
   * Maps HTTP status codes to error codes.
   *
   * @param status The HTTP status code.
   * @returns The corresponding error code.
   */
  private statusToErrorCode(status: number): string {
    const codeMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
    };
    return codeMap[status] || 'UNKNOWN_ERROR';
  }
}
