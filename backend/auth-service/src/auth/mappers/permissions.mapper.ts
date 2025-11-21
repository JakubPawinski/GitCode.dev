import { AppPermission, AppPermissions } from '../enums/permissions.enum';

const REGULAR_USER_PERMISSIONS: AppPermissions = [
  // Social
  AppPermission.SOCIAL_FRIEND_INVITE,
  AppPermission.SOCIAL_FRIEND_REMOVE,
  AppPermission.SOCIAL_FRIEND_RESPOND,
  AppPermission.SOCIAL_FRIEND_LIST,
  AppPermission.SOCIAL_FRIEND_STATS,
  AppPermission.SOCIAL_LEADERBOARD_VIEW,
  AppPermission.DISCUSSION_READ,
  // Discussion
  AppPermission.DISCUSSION_READ,
  AppPermission.DISCUSSION_COMMENT_CREATE,
  AppPermission.DISCUSSION_COMMENT_UPDATE_SELF,
  AppPermission.DISCUSSION_COMMENT_DELETE_SELF,
  AppPermission.DISCUSSION_VOTE,
  // Problems
  AppPermission.PROBLEM_READ,
  // Submissions
  AppPermission.SUBMISSION_CREATE,
  AppPermission.SUBMISSION_READ_SELF,
  // User management
  AppPermission.USER_READ_PUBLIC,
  AppPermission.USER_UPDATE_SELF,
  AppPermission.USER_DELETE_SELF,
  // User preferences
  AppPermission.USER_PREFERENCE_READ,
  AppPermission.USER_PREFERENCE_UPDATE,
  // Github
  AppPermission.GITHUB_CONNECT,
  AppPermission.GITHUB_DISCONNECT,
  AppPermission.GITHUB_PUSH,
  AppPermission.GITHUB_SYNC,
  // Payments & subscriptions
  AppPermission.PAYMENT_INITIATE,
  AppPermission.PAYMENT_READ_SELF,
  AppPermission.SUBSCRIPTION_MANAGE,
];
const PREMIUM_USER_ADDITIONAL_PERMISSIONS: AppPermissions = [
  // Premium content
  AppPermission.PROBLEM_READ_PREMIUM,
  AppPermission.AI_REVIEW,
  AppPermission.AI_TUTOR,
  AppPermission.AI_INTERVIEW,
];
const MODERATOR_ADDITIONAL_PERMISSIONS: AppPermissions = [
  // Content moderation
  AppPermission.DISCUSSION_COMMENT_UPDATE_ANY,
  AppPermission.DISCUSSION_COMMENT_DELETE_ANY,
  AppPermission.SUBMISSION_READ_ANY,
  AppPermission.SUBMISSION_REVIEW,
  //
  AppPermission.PROBLEM_READ_HIDDEN,
];
const ADMIN_ADDITIONAL_PERMISSIONS: AppPermissions = [
  // Content management
  AppPermission.PROBLEM_CREATE,
  AppPermission.PROBLEM_UPDATE,
  AppPermission.PROBLEM_DELETE,
  // User management
  AppPermission.USER_READ_PRIVATE,
  AppPermission.USER_MANAGE,
  // System-wide
  AppPermission.ADMIN_ALL,
  AppPermission.SYSTEM_CONFIG,
];

const ROLE_PERMISSIONS_MAP: Record<string, AppPermissions> = {
  user: REGULAR_USER_PERMISSIONS,
  premium_user: PREMIUM_USER_ADDITIONAL_PERMISSIONS,
  moderator: MODERATOR_ADDITIONAL_PERMISSIONS,
  admin: ADMIN_ADDITIONAL_PERMISSIONS,
};

/**
 * Maps realm roles from Keycloak to application permissions.
 */
export function mapRolesToPermissions(roles: string[]): AppPermissions {
  const permissionsSet: Set<AppPermission> = new Set<AppPermission>();

  roles.forEach((role) => {
    const rolePermissions = ROLE_PERMISSIONS_MAP[role];
    if (rolePermissions) {
      rolePermissions.forEach((permission) => permissionsSet.add(permission));
    }
  });

  return Array.from(permissionsSet);
}
