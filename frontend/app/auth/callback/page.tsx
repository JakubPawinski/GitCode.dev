// GitCode.dev/frontend/app/auth/callback/page.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshAuth } = useAuth();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const handleCallback = async () => {
      try {
        const success = searchParams.get('success');
        const error = searchParams.get('error');

        if (error || success !== 'true') {
          const errorParam = error || 'authentication_failed';
          router.push(`/login?error=${errorParam}`);
          return;
        }

        const isAuthenticated = await refreshAuth();

        if (isAuthenticated) {
          router.push('/dashboard');
        } else {
          router.push('/login?error=session_init_failed');
        }
      } catch (error) {
        router.push('/login?error=callback_error');
      }
    };

    handleCallback();
  }, [searchParams, router, refreshAuth]);

  return (
    <div>
      <h2>Finalizing authentication...</h2>
      <p>Please wait while we complete your login.</p>
    </div>
  );
}