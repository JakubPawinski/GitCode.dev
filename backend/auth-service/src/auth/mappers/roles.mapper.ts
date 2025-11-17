import { AppRole, type AppRoles } from '../enums/roles.enum';

/*
 * Map Keycloak realm roles to application roles
 */
export function mapRealmRolesToAppRoles(realmRoles: string[]): AppRoles {
  const appRoles: AppRoles = [];

  if (realmRoles.includes('admin')) {
    appRoles.push(AppRole.ADMIN);
  }
  if (realmRoles.includes('user')) {
    appRoles.push(AppRole.USER);
  }
  if (realmRoles.includes('moderator')) {
    appRoles.push(AppRole.MODERATOR);
  }
  if (realmRoles.includes('instructor')) {
    appRoles.push(AppRole.INSTRUCTOR);
  }
  if (realmRoles.includes('premium_user')) {
    appRoles.push(AppRole.PREMIUM_USER);
  }

  return appRoles;
}
