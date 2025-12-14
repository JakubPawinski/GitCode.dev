'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Loader } from '@/components/loading/Loader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ 
  children, 
  allowedRoles = [] 
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      const redirectUrl = encodeURIComponent(pathname);
      router.push(`/login?redirect=${redirectUrl}`);
      return;
    }

    if (allowedRoles.length > 0 && user?.roles) {
      const hasRequiredRole = user.roles.some(role => allowedRoles.includes(role));
      if (!hasRequiredRole) {
        router.push('/forbidden');
      }
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background/50 backdrop-blur-sm">
        <Loader />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (allowedRoles.length > 0 && user?.roles) {
     const hasRequiredRole = user.roles.some(role => allowedRoles.includes(role));
     if (!hasRequiredRole) return null;
  }

  return <>{children}</>;
};