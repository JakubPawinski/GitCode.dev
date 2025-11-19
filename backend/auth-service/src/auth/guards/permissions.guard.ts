import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { AppPermissions } from '../enums/permissions.enum';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
/*
 * Guard to check if the user has the required permissions to access a route
 */
export class PermissionsGuards implements CanActivate {
  constructor(private reflector: Reflector) {}

  // Method to determine if the current user has the required permissions
  canActivate(context: ExecutionContext): boolean {
    // Get required permissions from metadata
    const requiredPermissions = this.reflector.getAllAndOverride<
      AppPermissions[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

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
    return requiredPermissions.every((permission) =>
      user.permissions.includes(permission),
    );
  }
}
