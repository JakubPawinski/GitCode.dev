// GitCode.dev/frontend/interfaces/user-interface.ts
export interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
  firstName?: string;
  lastName?: string;
  emailVerified: boolean;
}