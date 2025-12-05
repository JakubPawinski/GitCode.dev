// GitCode.dev/frontend/interfaces/user-interface.ts
export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  bio?: string;
  emailVerified: boolean;
  roles: string[];
}