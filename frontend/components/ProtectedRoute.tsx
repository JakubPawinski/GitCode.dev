'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

export const ProtectedRoute = ({ 
  children, 
  allowedRoles = [] 
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const hasRequiredRole = () => {
    if (allowedRoles.length === 0) return true;
    if (!user?.roles?.length) return false;
    return user.roles.some(role => allowedRoles.includes(role));
  };

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      const redirectUrl = encodeURIComponent(pathname);
      router.push(`/login?redirect=${redirectUrl}`);
      return;
    }

    if (!hasRequiredRole()) {
      router.push('/forbidden');
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, pathname, router]);

  if (isLoading) return <div>Loading authentication...</div>;
  if (!isAuthenticated || !hasRequiredRole()) return <div>Checking permissions...</div>;

  return <>{children}</>;
};