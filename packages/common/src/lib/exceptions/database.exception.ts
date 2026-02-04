import { HttpStatus } from '@nestjs/common';
import { BaseAppException, ErrorDetails } from './base.exception';

/**
 * Exception thrown for general database errors.
 */
export class DatabaseException extends BaseAppException {
  constructor(message: string, details?: ErrorDetails[]) {
    super(message, 'DATABASE_ERROR', HttpStatus.INTERNAL_SERVER_ERROR, details);
  }
}

/**
 * Exception thrown when a requested record is not found in the database.
 */
export class RecordNotFoundException extends BaseAppException {
  constructor(entity: string, identifier?: string) {
    const message = identifier
      ? `${entity} with identifier "${identifier}" not found`
      : `${entity} not found`;
    super(message, 'RECORD_NOT_FOUND', HttpStatus.NOT_FOUND, [
      { code: 'NOT_FOUND', field: entity, meta: { identifier } },
    ]);
  }
}

/**
 * Exception thrown when a unique constraint is violated in the database.
 */
export class UniqueConstraintException extends BaseAppException {
  constructor(field: string, value?: string) {
    const message = value
      ? `Record with ${field} "${value}" already exists`
      : `Duplicate value for field "${field}"`;
    super(message, 'UNIQUE_CONSTRAINT_VIOLATION', HttpStatus.CONFLICT, [
      { code: 'DUPLICATE', field, constraint: 'unique', meta: { value } },
    ]);
  }
}

/**
 * Exception thrown when a foreign key constraint is violated in the database.
 */
export class ForeignKeyConstraintException extends BaseAppException {
  constructor(field: string, relatedEntity?: string) {
    const message = relatedEntity
      ? `Referenced ${relatedEntity} does not exist`
      : `Foreign key constraint violation on field "${field}"`;
    super(message, 'FOREIGN_KEY_VIOLATION', HttpStatus.BAD_REQUEST, [
      {
        code: 'FK_VIOLATION',
        field,
        constraint: 'foreignKey',
        meta: { relatedEntity },
      },
    ]);
  }
}

/**
 * Exception thrown when there is a database connection error.
 */
export class DatabaseConnectionException extends BaseAppException {
  constructor() {
    super(
      'Unable to connect to database',
      'DATABASE_CONNECTION_ERROR',
      HttpStatus.SERVICE_UNAVAILABLE,
      undefined,
      false,
    );
  }
}

/**
 * Exception thrown when a database operation times out.
 */
export class DatabaseTimeoutException extends BaseAppException {
  constructor(operation?: string) {
    super(
      `Database operation timed out${operation ? `: ${operation}` : ''}`,
      'DATABASE_TIMEOUT',
      HttpStatus.GATEWAY_TIMEOUT,
    );
  }
}
