import { HttpStatus } from '@nestjs/common';
import { BaseAppException, ErrorDetails } from './base.exception';

/**
 * Exception thrown when a business rule is violated.
 */
export class BusinessRuleException extends BaseAppException {
  constructor(message: string, code: string, details?: ErrorDetails[]) {
    super(message, code, HttpStatus.UNPROCESSABLE_ENTITY, details);
  }
}

/**
 * Exception thrown when a requested operation cannot be performed because the resource is locked.
 */
export class ResourceLockedException extends BaseAppException {
  constructor(resource: string) {
    super(
      `Resource "${resource}" is currently locked`,
      'RESOURCE_LOCKED',
      HttpStatus.LOCKED,
    );
  }
}

/**
 * Exception thrown when a user exceeds the allowed rate limit.
 */
export class RateLimitException extends BaseAppException {
  constructor(retryAfter?: number) {
    super(
      'Too many requests',
      'RATE_LIMIT_EXCEEDED',
      HttpStatus.TOO_MANY_REQUESTS,
      retryAfter
        ? [{ code: 'RETRY_AFTER', meta: { seconds: retryAfter } }]
        : undefined,
    );
  }
}

/**
 * Exception thrown when a user does not have sufficient permissions to perform an action.
 */
export class InsufficientPermissionsException extends BaseAppException {
  constructor(action: string, resource: string) {
    super(
      `Insufficient permissions to ${action} ${resource}`,
      'INSUFFICIENT_PERMISSIONS',
      HttpStatus.FORBIDDEN,
      [{ code: 'FORBIDDEN', meta: { action, resource } }],
    );
  }
}
