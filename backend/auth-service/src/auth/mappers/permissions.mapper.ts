import { AppPermission, AppPermissions } from '../enums/permissions.enum';

/**
 * Maps realm roles from Keycloak to application permissions.
 */
export function mapRolesToPermissions(roles: string[]): AppPermissions {
  const permissions: AppPermissions = [];

  if (roles.includes('admin')) {
    // Full access for admin
    permissions.push(
      AppPermission.ADMIN_ALL,
      AppPermission.AI_INTERVIEW,
      AppPermission.AI_REVIEW,
      AppPermission.AI_TUTOR,
      AppPermission.GITHUB_PUSH,
      AppPermission.NOTIFICATION_SEND,
      AppPermission.PAYMENT_READ,
      AppPermission.PAYMENT_WRITE,
      AppPermission.PROBLEM_READ,
      AppPermission.PROBLEM_WRITE,
      AppPermission.PROBLEM_REVIEW,
      AppPermission.PROBLEM_DELETE,
      AppPermission.SUBMISSION_READ,
      AppPermission.SUBMISSION_REVIEW,
      AppPermission.SUBMISSION_WRITE,
      AppPermission.SUBMISSION_DELETE,
      AppPermission.USER_READ,
      AppPermission.USER_WRITE,
      AppPermission.USER_PREFERENCE_READ,
      AppPermission.USER_PREFERENCE_WRITE,
      AppPermission.USER_PREFERENCE_UPDATE,
      AppPermission.USER_PREFERENCE_DELETE,
    );
  } else if (roles.includes('moderator')) {
    // Moderator permissions
    permissions.push(
      AppPermission.SUBMISSION_READ,
      AppPermission.SUBMISSION_REVIEW,
      AppPermission.SUBMISSION_DELETE,
      AppPermission.USER_READ,
      AppPermission.PROBLEM_READ,
      AppPermission.PROBLEM_REVIEW,
      AppPermission.PROBLEM_DELETE,
      AppPermission.NOTIFICATION_SEND,
      AppPermission.USER_PREFERENCE_READ,
    );
  } else if (roles.includes('instructor')) {
    // Instructor permissions
    permissions.push(
      AppPermission.PROBLEM_READ,
      AppPermission.PROBLEM_WRITE,
      AppPermission.PROBLEM_REVIEW,
      AppPermission.PROBLEM_DELETE,
      AppPermission.SUBMISSION_READ,
      AppPermission.SUBMISSION_REVIEW,
      AppPermission.USER_READ,
      AppPermission.USER_PREFERENCE_READ,
    );
  } else if (roles.includes('premium_user')) {
    // Premium user permissions
    permissions.push(
      AppPermission.SUBMISSION_WRITE,
      AppPermission.SUBMISSION_READ,
      AppPermission.PROBLEM_READ,
      AppPermission.USER_READ,
      AppPermission.PAYMENT_READ,
      AppPermission.PAYMENT_WRITE,
      AppPermission.AI_INTERVIEW,
      AppPermission.AI_REVIEW,
      AppPermission.AI_TUTOR,
      AppPermission.USER_PREFERENCE_READ,
      AppPermission.USER_PREFERENCE_WRITE,
      AppPermission.USER_PREFERENCE_UPDATE,
    );
  } else {
    // Default user permissions
    permissions.push(
      AppPermission.SUBMISSION_WRITE,
      AppPermission.SUBMISSION_READ,
      AppPermission.PROBLEM_READ,
      AppPermission.USER_READ,
      AppPermission.PAYMENT_READ,
      AppPermission.PAYMENT_WRITE,
      AppPermission.USER_PREFERENCE_READ,
      AppPermission.USER_PREFERENCE_WRITE,
      AppPermission.USER_PREFERENCE_UPDATE,
    );
  }

  return permissions;
}
