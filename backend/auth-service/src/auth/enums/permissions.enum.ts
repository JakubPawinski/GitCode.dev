export enum AppPermission {
  // --- Admin permissions ---
  ADMIN_ALL = 'admin:all', // Full administrative permissions across all backend services and admin panel (only for ADMIN realm role). Allows access to all resources, including user management, system configuration, and overriding restrictions.
  SYSTEM_CONFIG = 'admin:system_config', // Permission to manage system-wide configurations in the Admin Service. Allows updating global settings, feature toggles, and system parameters that affect all users.

  // --- AI ---
  AI_INTERVIEW = 'ai:interview:participate', // Access to AI Interview features in the AI Service. Allows users to participate in AI-powered mock interviews, receive feedback, and access interview-related analytics.
  AI_REVIEW = 'ai:review:request', // Access to AI Reviewer features in the AI Service. Enables AI-assisted code reviews, suggestions for improvements, and automated testing feedback on submissions.
  AI_TUTOR = 'ai:tutor:chat', // Access to AI Tutor features in the AI Service. Provides personalized tutoring, hints, and explanations for coding problems and submissions.

  // --- Github permissions ---
  GITHUB_CONNECT = 'github:connect', // Permission to connect GitHub accounts via the GitHub Integration Service. Allows linking user accounts to GitHub for synchronization and repository access.
  GITHUB_DISCONNECT = 'github:disconnect', // Permission to disconnect GitHub accounts via the GitHub Integration Service. Allows unlinking user accounts from GitHub and revoking access.
  GITHUB_PUSH = 'github:push', // Permission to push approved solutions to GitHub repositories via GitHub Integration Service. Allows syncing solved problems or projects to user's GitHub account.
  GITHUB_SYNC = 'github:sync', // Permission to sync repositories from GitHub via GitHub Integration Service. Enables importing code, problems, or projects from linked GitHub accounts.

  // --- SOCIAL & COMMUNITY ---
  SOCIAL_FRIEND_INVITE = 'social:friend:invite', // Permission to invite friends in the Social Service. Allows sending invitations to connect with other users on the platform.
  SOCIAL_FRIEND_REMOVE = 'social:friend:remove', // Permission to remove friends in the Social Service. Enables disconnecting from existing friends and managing friend lists.
  SOCIAL_FRIEND_RESPOND = 'social:friend:respond', // Permission to respond to friend requests in the Social Service. Allows accepting or declining incoming friend invitations.
  SOCIAL_FRIEND_LIST = 'social:friend:list', // Permission to view friend lists in the Social Service. Enables accessing lists of friends, followers, and connections within the community.
  SOCIAL_FRIEND_STATS = 'social:friend:stats', // Permission to view friend statistics in the Social Service. Allows accessing data on friend activities, interactions, and engagement metrics.
  SOCIAL_LEADERBOARD_VIEW = 'social:leaderboard:view', // Permission to view leaderboards in the Social Service. Allows accessing rankings, scores, and achievements of users within the community.

  // --- Discussions ---
  DISCUSSION_READ = 'discussion:read', // Permission to read discussions from the Discussion Service. Allows viewing discussion threads, comments, and related content.
  DISCUSSION_COMMENT_CREATE = 'discussion:comment:create', // Permission to create comments in the Discussion Service. Allows users to post comments on discussion threads, problems, or submissions.
  DISCUSSION_COMMENT_UPDATE_SELF = 'discussion:comment:update:self', // Permission to update own comments in the Discussion Service. Enables users to edit their own comments for clarity or corrections.
  DISCUSSION_COMMENT_UPDATE_ANY = 'discussion:comment:update:any', // Permission to update any user's comments in the Discussion Service. Allows moderators or admins to edit comments that violate guidelines or need moderation.
  DISCUSSION_COMMENT_DELETE_SELF = 'discussion:comment:delete:self', // Permission to delete own comments in the Discussion Service. Enables users to remove their own comments from discussion threads.
  DISCUSSION_COMMENT_DELETE_ANY = 'discussion:comment:delete:any', // Permission to delete any user's comments in the Discussion Service. Allows moderators or admins to remove comments that violate guidelines.
  DISCUSSION_VOTE = 'discussion:vote', // Permission to vote on comments in the Discussion Service. Allows users to upvote or downvote comments to indicate agreement or quality.

  // --- Payments & subsciriptions ---
  PAYMENT_READ_SELF = 'payment:read:self', // Permission to read payment and subscription status from the Payment Service. Allows viewing billing history, active subscriptions, and payment methods.
  PAYMENT_INITIATE = 'payment:initiate', // Permission to initiate payments via the Payment Service. Enables starting new subscriptions, processing one-time payments, or upgrading plans.
  SUBSCRIPTION_MANAGE = 'subscription:manage', // Permission to manage subscriptions via the Payment Service. Allows updating subscription plans, cancelling subscriptions, or modifying billing details.

  // --- Task (Problems) ---
  PROBLEM_READ = 'problem:read', // Permission to read tasks from the Task Service. Allows viewing problem descriptions, examples, and metadata without editing.
  PROBLEM_CREATE = 'problem:create', // Permission to create tasks in the Task Service. Enables adding new problems, test cases, and related content to the system.
  PROBLEM_UPDATE = 'problem:update', // Permission to update tasks in the Task Service. Allows modifying existing problems, test cases, or related content.
  PROBLEM_DELETE = 'problem:delete', // Permission to delete tasks in the Task Service. Enables removing problems or test cases from the system.
  PROBLEM_READ_PREMIUM = 'problem:read:premium', // Permission to read premium tasks in the Task Service. Allows access to exclusive problems that may require a subscription or special access.
  PROBLEM_READ_HIDDEN = 'problem:read:hidden', // Permission to read hidden tasks in the Task Service. Allows access to problems that are not publicly visible, typically for admins or moderators. It allowes to see test cases as well.

  // --- Submission  ---
  SUBMISSION_CREATE = 'submission:create', // Permission to create submissions in the Submission Service. Allows users to submit solutions for tasks, triggering evaluation and feedback.
  SUBMISSION_READ_SELF = 'submission:read:self', // Permission to read own submissions from the Submission Service. Allows viewing personal submission history, results, and feedback.
  SUBMISSION_READ_ANY = 'submission:read:any', // Permission to read any user's submissions from the Submission Service. Enables viewing submissions made by other users, for admins or reviewers.
  SUBMISSION_REVIEW = 'submission:review', // Permission to review submissions in the Submission Service. Allows evaluating, commenting, and providing feedback on user submissions.

  // --- User management ---
  USER_READ_PUBLIC = 'user:read:public', // Permission to read public user profiles in the User Service. Allows viewing basic information like username, bio, and public activity.
  USER_READ_PRIVATE = 'user:read:private', // Permission to read private user profiles in the User Service. Enables access to additional details such as email, preferences, and activity history (typically for admins).
  USER_READ_SELF = 'user:read:self', // Permission to read own user profile in the User Service. Allows users to access their personal information, settings, and activity data.
  USER_UPDATE_SELF = 'user:update:self', // Permission to update own user profile in the User Service. Allows modifying personal information, profile picture, and other settings.
  USER_DELETE_SELF = 'user:delete:self', // Permission to delete own user account in the User Service. Enables users to remove their account and associated data from the platform.
  USER_MANAGE = 'user:manage', // Permission to manage other user accounts in the User Service. Allows admins to update, suspend, or delete user accounts.

  // User preference permissions
  USER_PREFERENCE_READ = 'user:preference:read', // Permission to read user preferences. Allows viewing settings like theme, language, notification preferences, or coding environment configs.
  USER_PREFERENCE_UPDATE = 'user:preference:update', // Permission to update user preferences. Allows modifying existing settings, such as changing theme or updating notification rules.


}

export type AppPermissions = AppPermission[];
