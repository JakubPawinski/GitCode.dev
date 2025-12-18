'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth/AuthContext';
import TokenStore from '@/utils/token-store';
import { Loader } from '@/components/loading/Loader';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshAuth, isLoading } = useAuth();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current || isLoading) return;
    processedRef.current = true;

    const handleCallback = async () => {
      try {
        const success = searchParams.get('success');
        const error = searchParams.get('error');
        const redirectDestination = searchParams.get('redirect') || '/';
        
        if (TokenStore.getToken()) {
          router.push(redirectDestination);
          return;
        }

        if (error || success !== 'true') {
          const errorParam = error || 'authentication_failed';
          router.push(`/login?error=${errorParam}`);
          return;
        }

        await refreshAuth();
        router.push(redirectDestination);
      } catch (error) {
        console.error('Callback error:', error);
        router.push('/login?error=callback_error');
      }
    };

    handleCallback();
  }, [isLoading, searchParams, router, refreshAuth]);

  return (
    <Loader />
  );
}
