import {
  DatabaseException,
  RecordNotFoundException,
  UniqueConstraintException,
  ForeignKeyConstraintException,
  DatabaseConnectionException,
  DatabaseTimeoutException,
} from './database.exception';
import { BaseAppException } from './base.exception';

/**
 * Interface for Prisma-like errors (duck typing)
 */
interface PrismaKnownRequestError {
  code: string;
  meta?: Record<string, unknown>;
  name: string;
}

/**
 * Maps Prisma errors to application-specific exceptions.
 */
export class PrismaExceptionMapper {
  private static readonly ERROR_CODE_MAP: Record<
    string,
    (e: PrismaKnownRequestError) => BaseAppException
  > = {
    P2002: (e) => {
      const target = e.meta?.target;
      const field = Array.isArray(target)
        ? target.join(', ')
        : String(target || 'unknown');
      return new UniqueConstraintException(field);
    },
    P2003: (e) => {
      const field = String(e.meta?.field_name || 'unknown');
      return new ForeignKeyConstraintException(field);
    },
    P2001: (e) => {
      const model = String(e.meta?.modelName || 'Record');
      return new RecordNotFoundException(model);
    },
    P2025: (e) => {
      const cause = String(e.meta?.cause || 'Record not found');
      return new RecordNotFoundException(cause);
    },
    P2012: (e) => {
      const field = String(e.meta?.path || 'unknown');
      return new DatabaseException(`Missing required field: ${field}`, [
        { code: 'REQUIRED_FIELD', field },
      ]);
    },
    P1001: () => new DatabaseConnectionException(),
    P1002: () => new DatabaseConnectionException(),
    P1008: () => new DatabaseTimeoutException(),
    P2024: () => new DatabaseTimeoutException('Connection pool timeout'),
    P2006: (e) => {
      const field = String(e.meta?.model_name || 'unknown');
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
    if (!this.isPrismaError(error)) {
      return null;
    }

    const prismaError = error as PrismaKnownRequestError;

    // Handle known request errors (P-codes)
    if (prismaError.code?.startsWith('P')) {
      const mapper = this.ERROR_CODE_MAP[prismaError.code];
      if (mapper) {
        return mapper(prismaError);
      }
      return new DatabaseException(`Database error: ${prismaError.code}`, [
        {
          code: prismaError.code,
          meta: prismaError.meta as Record<string, any>,
        },
      ]);
    }

    // Handle other Prisma errors by name
    switch (prismaError.name) {
      case 'PrismaClientUnknownRequestError':
        return new DatabaseException('Unknown database error occurred');
      case 'PrismaClientValidationError':
        return new DatabaseException('Database validation error');
      case 'PrismaClientInitializationError':
        return new DatabaseConnectionException();
      case 'PrismaClientRustPanicError':
        return new DatabaseException('Critical database error', undefined);
      default:
        return null;
    }
  }

  /**
   * Checks if the given error is a Prisma error using duck typing.
   */
  static isPrismaError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const err = error as { name?: string };

    return (
      err.name === 'PrismaClientKnownRequestError' ||
      err.name === 'PrismaClientUnknownRequestError' ||
      err.name === 'PrismaClientValidationError' ||
      err.name === 'PrismaClientInitializationError' ||
      err.name === 'PrismaClientRustPanicError'
    );
  }
}
