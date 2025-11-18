//GitCode.dev/frontend/contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthResponse } from '@/types/auth';
import { authAPI } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (provider?: string) => void;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Check if we have a token in localStorage (from previous session)
      const storedToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setAccessToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Verify the token is still valid by fetching profile
        try {
          await authAPI.getProfile();
        } catch (error) {
          console.log('Stored token invalid, trying refresh...');
          await refreshAuth();
        }
      } else {
        // Try to refresh token using http-only cookie
        await refreshAuth();
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      // Clear any invalid stored data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAuth = async () => {
    try {
      console.log('Refreshing auth token...');
      const response = await authAPI.refreshToken();
      const { accessToken: newToken, user: userData } = response.data!;

      setAccessToken(newToken);
      setUser(userData);
      
      localStorage.setItem('accessToken', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      console.log('Auth token refreshed successfully');
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Don't throw error here, just clear state
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
  };

  const login = (provider: string = 'keycloak') => {
    authAPI.login(provider);
  };

  const logout = async () => {
    try {
      console.log('Initiating logout...');
      // Wywołaj endpoint logout w backendzie który unieważni refresh token
      await authAPI.logout();
      console.log('Backend logout successful');
    } catch (error) {
      console.error('Logout API error:', error);
      // Kontynuuj nawet jeśli API call się nie udał
    } finally {
      // Zawsze czyść stan lokalny niezależnie od odpowiedzi backendu
      console.log('Clearing local auth state...');
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      
      // Przekieruj na stronę logowania
      console.log('Redirecting to login...');
      window.location.href = '/login';
    }
  };

  const value: AuthContextType = {
    user,
    accessToken,
    isLoading,
    isAuthenticated: !!user && !!accessToken,
    login,
    logout,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};