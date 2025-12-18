'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader } from '@/components/loading/Loader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ 
  children, 
  allowedRoles = [] 
}: ProtectedRouteProps) => {
  const { isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (allowedRoles.length > 0 && user?.roles) {
      const hasRequiredRole = user.roles.some(role => allowedRoles.includes(role));
      if (!hasRequiredRole) {
        router.push('/forbidden');
      }
    }
  }, [isLoading, user, allowedRoles, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background/50 backdrop-blur-sm">
        <Loader />
      </div>
    );
  }

  return <>{children}</>;
};