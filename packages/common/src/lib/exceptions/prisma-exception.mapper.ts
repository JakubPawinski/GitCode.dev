import { Prisma } from '@prisma/client';
import {
  DatabaseException,
  RecordNotFoundException,
  UniqueConstraintException,
  ForeignKeyConstraintException,
  DatabaseConnectionException,
  DatabaseTimeoutException,
} from './prisma.exception';
import { BaseAppException } from './base.exception';

/**
 * Maps Prisma errors to application-specific exceptions.
 */
export class PrismaExceptionMapper {
  /**
   * Mapping of Prisma error codes to exception constructors
   * */
  private static readonly ERROR_CODE_MAP: Record<
    string,
    (e: any) => BaseAppException
  > = {
    P2002: (e) => {
      const target = e.meta?.target;
      const field = Array.isArray(target)
        ? target.join(', ')
        : target || 'unknown';
      return new UniqueConstraintException(field);
    },
    P2003: (e) => {
      const field = e.meta?.field_name || 'unknown';
      return new ForeignKeyConstraintException(field);
    },
    P2001: (e) => {
      const model = e.meta?.modelName || 'Record';
      return new RecordNotFoundException(model);
    },
    P2025: (e) => {
      const cause = e.meta?.cause || 'Record not found';
      return new RecordNotFoundException(cause);
    },
    P2012: (e) => {
      const field = e.meta?.path || 'unknown';
      return new DatabaseException(`Missing required field: ${field}`, [
        { code: 'REQUIRED_FIELD', field },
      ]);
    },
    P1001: () => new DatabaseConnectionException(),
    P1002: () => new DatabaseConnectionException(),
    P1008: () => new DatabaseTimeoutException(),
    P2024: () => new DatabaseTimeoutException('Connection pool timeout'),
    P2006: (e) => {
      const field = e.meta?.model_name || 'unknown';
      return new DatabaseException(`Invalid value for field: ${field}`, [
        { code: 'INVALID_VALUE', field },
      ]);
    },
  };

  /**
   * Maps a Prisma error to a BaseAppException.
   * Returns null if the error is not a recognized Prisma error.
   */
  static map(error: unknown): BaseAppException | null {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const mapper = this.ERROR_CODE_MAP[error.code];
      if (mapper) {
        return mapper(error);
      }
      return new DatabaseException(`Database error: ${error.code}`, [
        { code: error.code, meta: error.meta as Record<string, any> },
      ]);
    }

    if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      return new DatabaseException('Unknown database error occurred');
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      const message = error.message;
      return new DatabaseException(
        `Validation error: ${message.split('\n').pop()}`,
      );
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
      return new DatabaseConnectionException();
    }

    if (error instanceof Prisma.PrismaClientRustPanicError) {
      return new DatabaseException('Critical database error', undefined);
    }

    return null;
  }

  /**
   * Checks if the given error is a Prisma error.
   */
  static isPrismaError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError ||
      error instanceof Prisma.PrismaClientUnknownRequestError ||
      error instanceof Prisma.PrismaClientValidationError ||
      error instanceof Prisma.PrismaClientInitializationError ||
      error instanceof Prisma.PrismaClientRustPanicError
    );
  }
}
