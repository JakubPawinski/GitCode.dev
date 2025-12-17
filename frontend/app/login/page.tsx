'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Login } from '@/components/login/Login';
import { Loader } from '@/components/loading/Loader';

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const redirect = searchParams.get('redirect') || '/';
      router.push(redirect);
    }
  }, [isAuthenticated, isLoading, router, searchParams]);

  if (isLoading || isAuthenticated) {
    return <Loader />;
  }

  return <Login />;
}
