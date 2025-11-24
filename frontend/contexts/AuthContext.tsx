// GitCode.dev/frontend/contexts/AuthContext.tsx
'use client';
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User } from '@/interfaces/user-interface';
import { useGetProfile } from '@/hooks/api/use-get-profile';
import { useRefreshToken } from '@/hooks/api/use-refresh-token';
import { useLogout } from '@/hooks/api/use-logout';
import { useLogin } from '@/hooks/api/use-login';
import { AuthContextType } from '@/interfaces/auth-context-type-interface';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshAttempted, setRefreshAttempted] = useState(false);
  const initializingRef = useRef(false);

  const { data: profileData, loading: profileLoading, error: profileError, refetch: refetchProfile } = useGetProfile();
  const { refreshMutation: refreshTokenMutation } = useRefreshToken();
  const { logoutMutation } = useLogout();
  const { login: loginHook } = useLogin();

  useEffect(() => {
    if (profileData?.data) {
      setUser(profileData.data);
    }
  }, [profileData]);

  useEffect(() => {
    if (!initializingRef.current) {
      initializingRef.current = true;
      initializeAuth();
    }
  }, []);

  useEffect(() => {
    if (profileError?.response?.status === 401 && !refreshAttempted && !profileLoading) {
      setRefreshAttempted(true);
      refreshAuth();
    }
  }, [profileError?.response?.status, refreshAttempted, profileLoading]);

  const initializeAuth = async () => {
    try {
      await refreshAuth();
    } catch (error) {
      console.error('Auth initialization error:', error);
      handleAuthFailure();
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAuth = async (): Promise<boolean> => {
    try {
      const response = await refreshTokenMutation();
      if (response?.data) {
        const { user: userData } = response.data;
        setUser(userData);
        setRefreshAttempted(false);
        return true;
      }
      return false;
    } catch (error: any) {
      if (error?.response?.status !== 401) {
        console.error('Token refresh failed with unexpected error:', error);
      }
      return false;
    }
  };

  const handleAuthFailure = () => {
    setUser(null);
    setRefreshAttempted(false);
  };

  const login = (provider: string = 'keycloak') => {
    loginHook(provider);
  };

  const logout = async () => {
    try {
      await logoutMutation();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      handleAuthFailure();
    }
  };

  const value: AuthContextType = {
    user,
    isLoading: isLoading || profileLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};