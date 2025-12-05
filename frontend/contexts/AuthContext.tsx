// GitCode.dev/frontend/contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContextType } from '@/interfaces/auth-context-type-interface';
import { User } from '@/interfaces/user-interface';
import { useRefreshToken } from '@/hooks/api/use-refresh-token';
import { useGetProfile } from '@/hooks/api/use-get-profile';
import { useLogin } from '@/hooks/api/use-login';
import { useLogout } from '@/hooks/api/use-logout';
import TokenStore from '@/utils/token-store';

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
  const router = useRouter();

  const { refreshMutation } = useRefreshToken();
  const { refetch: getProfile } = useGetProfile();
  const { login } = useLogin();
  const { logoutMutation } = useLogout();

  const refreshToken = async (): Promise<string | null> => {
    try {
      const refreshResponse = await refreshMutation();
      const accessToken = refreshResponse?.data?.accessToken;
      
      if (accessToken) {
        TokenStore.setToken(accessToken);
        return accessToken;
      }
    } catch (error) {}
    TokenStore.clear();
    return null;
  };

  const refreshUser = async (): Promise<User | null> => {
    try {
      const profileResponse = await getProfile();
      const userData = profileResponse?.data;
      
      if (userData) {
        setUser(userData);
        return userData;
      }
    } catch (error) {}
    setUser(null);
    return null;
  };

  const handleLogin = () => {
    login();
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await logoutMutation();
    } finally {
      TokenStore.clear();
      setUser(null);
      router.push('/login');
    }
  };

  const refreshTokenAndUser = async (): Promise<boolean> => {
    const token = await refreshToken();
    if (!token) return false;
    
    const user = await refreshUser();
    return !!user;
  };

  const initializeAuth = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await refreshTokenAndUser();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (!TokenStore.getToken() && user) {
      setUser(null);
    }
    if (!TokenStore.getToken() && !isLoading && user) {
      setUser(null);
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (!TokenStore.getToken() && !user && !isLoading) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: handleLogin,
    logout: handleLogout,
    refreshAuth: refreshTokenAndUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};