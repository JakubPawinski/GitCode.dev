export enum AppPermission {
  // Administration permissions
  ADMIN_ALL = 'admin.all', // Full administrative permissions across all backend services and admin panel (only for ADMIN realm role). Allows access to all resources, including user management, system configuration, and overriding restrictions.

  // AI-related permissions
  AI_INTERVIEW = 'ai.interview', // Access to AI Interview features in the AI Service. Allows users to participate in AI-powered mock interviews, receive feedback, and access interview-related analytics.
  AI_REVIEW = 'ai.review', // Access to AI Reviewer features in the AI Service. Enables AI-assisted code reviews, suggestions for improvements, and automated testing feedback on submissions.
  AI_TUTOR = 'ai.tutor', // Access to AI Tutor features in the AI Service. Provides personalized tutoring, hints, and explanations for coding problems and submissions.

  // Github permissions
  GITHUB_PUSH = 'github.push', // Permission to push approved solutions to GitHub repositories via GitHub Integration Service. Allows syncing solved problems or projects to user's GitHub account.

  // Notification permissions
  NOTIFICATION_SEND = 'notification.send', // Permission to send notifications through the Notification Service. Enables sending emails, in-app notifications, or alerts about submissions, reviews, or system updates.

  // Payment permissions
  PAYMENT_READ = 'payment.read', // Permission to read payment and subscription status from the Payment Service. Allows viewing billing history, active subscriptions, and payment methods.
  PAYMENT_WRITE = 'payment.write', // Permission to write payment information in the Payment Service. Enables creating new payments, updating subscriptions, or changing billing details.

  // Problem and submission permissions
  PROBLEM_READ = 'problem.read', // Permission to read tasks from the Task Service. Allows viewing problem descriptions, examples, and metadata without editing.
  PROBLEM_WRITE = 'problem.write', // Permission to create or edit tasks in the Task Service. Enables adding new problems, updating descriptions, or modifying test cases.
  PROBLEM_REVIEW = 'problem.review', // Permission to review tasks in the Task Service. Allows approving, rejecting, or providing feedback on submitted problems before publication.
  PROBLEM_DELETE = 'problem.delete', // Permission to delete tasks in the Task Service. Enables removing problems or test cases from the system.
  SUBMISSION_READ = 'submission.read', // Permission to read submissions in the Submission Service. Allows viewing user-submitted solutions, code, and results.
  SUBMISSION_REVIEW = 'submission.review', // Permission to review submissions of other users (Moderator role). Enables grading, commenting, or approving submissions.
  SUBMISSION_WRITE = 'submission.write', // Permission to submit solutions to the Submission Service. Allows uploading code, running tests, and viewing personal submission history.
  SUBMISSION_DELETE = 'submission.delete', // Permission to delete submissions in the Submission Service. Enables removing own or others' submissions (e.g., for moderation).

  // User management permissions
  USER_READ = 'user.read', // Permission to read user profiles from the User Service. Allows viewing public user information, profiles, and basic stats.
  USER_WRITE = 'user.write', // Permission to edit user profiles in the User Service. Enables updating own profile or, for admins, editing others' profiles.

  // User preference permissions
  USER_PREFERENCE_READ = 'user.preference.read', // Permission to read user preferences. Allows viewing settings like theme, language, notification preferences, or coding environment configs.
  USER_PREFERENCE_WRITE = 'user.preference.write', // Permission to write user preferences. Enables creating or setting initial preferences for themes, notifications, or custom settings.
  USER_PREFERENCE_UPDATE = 'user.preference.update', // Permission to update user preferences. Allows modifying existing settings, such as changing theme or updating notification rules.
  USER_PREFERENCE_DELETE = 'user.preference.delete', // Permission to delete user preferences. Enables resetting or removing custom preferences back to defaults.
}

export type AppPermissions = AppPermission[];
