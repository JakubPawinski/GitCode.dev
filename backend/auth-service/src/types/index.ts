import { AppPermission } from '../auth/enums/permissions.enum';
import { AppRole } from '../auth/enums/roles.enum';

export type UUID = string;

export type AuthenticatedUser = {
  id: UUID;
  email: string;
  roles: AppRole[];
  permissions: AppPermission[];
  username: string;
};
