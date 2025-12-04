import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppPermission, AppPermissions } from '@gitcode/types';
import { PERMISSIONS_KEY } from '../decorators/permission.decorator.ts';

@Injectable()
/*
 * Guard to check if the user has the required permissions to access a route
 */
export class PermissionsGuards implements CanActivate {
  private readonly logger = new Logger(PermissionsGuards.name);
  constructor(private reflector: Reflector) {}

  // Method to determine if the current user has the required permissions
  canActivate(context: ExecutionContext): boolean {
    // Get required permissions from metadata
    const requiredPermissions = this.reflector.getAllAndOverride<
      AppPermissions[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    this.logger.debug(
      `Validating permissions with required permissions: ${requiredPermissions}`,
    );
    // If no permissions are required, allow access
    if (!requiredPermissions) {
      return true;
    }

    // Get user from request
    const { user } = context.switchToHttp().getRequest();

    // Check if user exists in request and has permissions
    if (!user || !user.permissions) {
      return false;
    }

    // Verify that user has all required permissions
    return (
      requiredPermissions.every((permission) =>
        user.permissions.includes(permission),
      ) || user.permissions.includes(AppPermission.ADMIN_ALL)
    );
  }
}
