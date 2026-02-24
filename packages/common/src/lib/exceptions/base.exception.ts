import { HttpException, HttpStatus } from '@nestjs/common';

export interface ErrorDetails {
  code: string;
  field?: string;
  constraint?: string;
  meta?: Record<string, any>;
  [key: string]: any;
}

/**
 * Base class for application-specific exceptions.
 */
export abstract class BaseAppException extends HttpException {
  public readonly errorCode: string;
  public readonly details?: ErrorDetails[];
  public readonly isOperational: boolean;

  constructor(
    message: string,
    errorCode: string,
    status: HttpStatus,
    details?: ErrorDetails[],
    isOperational = true,
  ) {
    super({ message, errorCode, details }, status);
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = isOperational;
  }
}
