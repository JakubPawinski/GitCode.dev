import { SetMetadata } from '@nestjs/common';
import { AppPermission } from '../enums/permissions.enum';

// Key to store permissions metadata
export const PERMISSIONS_KEY = 'permissions';

// Decorator to specify required permissions for a route handler
export const RequirePermissions = (...permissions: AppPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
