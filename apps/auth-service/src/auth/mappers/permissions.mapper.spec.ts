import { mapRolesToPermissions } from './permissions.mapper';
import { AppPermission } from '@gitcode/types';

describe('mapRolesToPermissions', () => {
  it('should map user role to regular user permissions', () => {
    const roles = ['user'];
    const permissions = mapRolesToPermissions(roles);

    expect(permissions).toContain(AppPermission.USER_READ_PUBLIC);
    expect(permissions).toContain(AppPermission.PROBLEM_READ);
    expect(permissions).toContain(AppPermission.SUBMISSION_CREATE);
    expect(permissions).not.toContain(AppPermission.ADMIN_ALL);
  });

  it('should map premium_user role to additional premium permissions', () => {
    const roles = ['premium_user'];
    const permissions = mapRolesToPermissions(roles);

    expect(permissions).toContain(AppPermission.PROBLEM_READ_PREMIUM);
    expect(permissions).toContain(AppPermission.AI_REVIEW);
    expect(permissions).toContain(AppPermission.AI_TUTOR);
  });

  it('should map moderator role to moderator permissions', () => {
    const roles = ['moderator'];
    const permissions = mapRolesToPermissions(roles);

    expect(permissions).toContain(AppPermission.DISCUSSION_COMMENT_UPDATE_ANY);
    expect(permissions).toContain(AppPermission.SUBMISSION_REVIEW);
    expect(permissions).toContain(AppPermission.PROBLEM_READ_HIDDEN);
  });

  it('should map admin role to admin permissions', () => {
    const roles = ['admin'];
    const permissions = mapRolesToPermissions(roles);

    expect(permissions).toContain(AppPermission.PROBLEM_CREATE);
    expect(permissions).toContain(AppPermission.USER_READ_PRIVATE);
    expect(permissions).toContain(AppPermission.ADMIN_ALL);
  });

  it('should combine permissions for multiple roles without duplicates', () => {
    const roles = ['user', 'premium_user'];
    const permissions = mapRolesToPermissions(roles);

    expect(permissions).toContain(AppPermission.USER_READ_PUBLIC); // from user
    expect(permissions).toContain(AppPermission.PROBLEM_READ_PREMIUM); // from premium_user
    expect(permissions).toContain(AppPermission.AI_REVIEW); // from premium_user
    // Ensure no duplicates
    const uniquePermissions = new Set(permissions);
    expect(uniquePermissions.size).toBe(permissions.length);
  });

  it('should return empty array for unknown roles', () => {
    const roles = ['unknown_role'];
    const permissions = mapRolesToPermissions(roles);

    expect(permissions).toEqual([]);
  });

  it('should return empty array for empty roles', () => {
    const roles: string[] = [];
    const permissions = mapRolesToPermissions(roles);

    expect(permissions).toEqual([]);
  });

  it('should handle mixed known and unknown roles', () => {
    const roles = ['user', 'unknown_role'];
    const permissions = mapRolesToPermissions(roles);

    expect(permissions).toContain(AppPermission.USER_READ_PUBLIC);
    expect(permissions).toContain(AppPermission.PROBLEM_READ);
    expect(permissions).not.toContain(AppPermission.ADMIN_ALL);
  });
});
