// GitCode.dev/frontend/components/ProtectedRoute.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

export const ProtectedRoute = ({ 
  children, 
  allowedRoles 
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [redirectPath, setRedirectPath] = useState('');

  const hasRequiredRole = () => {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    if (!user?.roles) return false;
    
    return user.roles.some(role => allowedRoles.includes(role));
  };

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        const redirectUrl = encodeURIComponent(pathname);
        setRedirectPath(`/login?redirect=${redirectUrl}`);
        setShouldRedirect(true);
      } else if (!hasRequiredRole()) {
        setRedirectPath('/forbidden');
        setShouldRedirect(true);
      }
    }
  }, [isAuthenticated, isLoading, user, allowedRoles, pathname]);

  useEffect(() => {
    if (shouldRedirect && redirectPath) {
      router.push(redirectPath);
    }
  }, [shouldRedirect, redirectPath, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !hasRequiredRole()) {
    return <div>Redirecting...</div>;
  }

  return <>{children}</>;
};