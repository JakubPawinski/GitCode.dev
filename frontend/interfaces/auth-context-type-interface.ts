// GitCode.dev/frontend/interfaces/auth-context-type-interface.ts
import {User} from '@/interfaces/user-interface'

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (provider?: string) => void;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
}