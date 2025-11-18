//GitCode.dev/frontend/components/ProtectedRoute.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    // Dajemy chwilę na zainicjalizowanie auth state
    const timer = setTimeout(() => {
      if (!isLoading && !isAuthenticated) {
        setShouldRedirect(true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (shouldRedirect) {
      console.log('ProtectedRoute: User not authenticated, redirecting to login');
      router.push('/login');
    }
  }, [shouldRedirect, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Verifying authentication...</div>
      </div>
    );
  }

  return <>{children}</>;
};