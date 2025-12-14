import { UUID } from '../common/uuid.type.ts';
import { AppRole } from './roles.enum.ts';
import { AppPermission } from './permissions.enum.ts';

export type AuthenticatedUser = {
  id: UUID;
  email: string;
  roles: AppRole[];
  permissions: AppPermission[];
  username: string;
};
