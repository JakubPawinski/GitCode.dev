import { mapRealmRolesToAppRoles } from './roles.mapper';
import { AppRole } from '@gitcode/types';

describe('mapRealmRolesToAppRoles', () => {
  it('should map admin realm role to admin app role', () => {
    const realmRoles = ['admin'];
    const appRoles = mapRealmRolesToAppRoles(realmRoles);

    expect(appRoles).toEqual([AppRole.ADMIN]);
  });

  it('should map user realm role to user app role', () => {
    const realmRoles = ['user'];
    const appRoles = mapRealmRolesToAppRoles(realmRoles);

    expect(appRoles).toEqual([AppRole.USER]);
  });

  it('should map moderator realm role to moderator app role', () => {
    const realmRoles = ['moderator'];
    const appRoles = mapRealmRolesToAppRoles(realmRoles);

    expect(appRoles).toEqual([AppRole.MODERATOR]);
  });

  it('should map premium_user realm role to premium_user app role', () => {
    const realmRoles = ['premium_user'];
    const appRoles = mapRealmRolesToAppRoles(realmRoles);

    expect(appRoles).toEqual([AppRole.PREMIUM_USER]);
  });

  it('should map multiple realm roles to app roles', () => {
    const realmRoles = ['admin', 'user', 'moderator'];
    const appRoles = mapRealmRolesToAppRoles(realmRoles);

    expect(appRoles).toEqual([AppRole.ADMIN, AppRole.USER, AppRole.MODERATOR]);
  });

  it('should return empty array for unknown realm roles', () => {
    const realmRoles = ['unknown_role'];
    const appRoles = mapRealmRolesToAppRoles(realmRoles);

    expect(appRoles).toEqual([]);
  });

  it('should return empty array for empty realm roles', () => {
    const realmRoles: string[] = [];
    const appRoles = mapRealmRolesToAppRoles(realmRoles);

    expect(appRoles).toEqual([]);
  });

  it('should handle mixed known and unknown realm roles', () => {
    const realmRoles = ['user', 'unknown_role', 'admin'];
    const appRoles = mapRealmRolesToAppRoles(realmRoles);

    expect(appRoles).toEqual([AppRole.ADMIN, AppRole.USER]);
  });

  it('should not duplicate roles if realm roles are duplicated', () => {
    const realmRoles = ['user', 'user'];
    const appRoles = mapRealmRolesToAppRoles(realmRoles);

    expect(appRoles).toEqual([AppRole.USER]);
  });
});
