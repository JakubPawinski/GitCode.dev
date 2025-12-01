// GitCode.dev/frontend/app/auth/callback/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallbackPage() {
  const { refreshAuth, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const handleCallback = async () => {
      const success = searchParams.get('success');
      if (success === 'true') {
        await refreshAuth();
        setStatus('success');
      } else {
        setStatus('error');
      }
    };
    handleCallback();
  }, [refreshAuth, searchParams]);

  useEffect(() => {
    if (isAuthenticated && status === 'success') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, status, router]);

  if (status === 'loading' || isLoading) {
    return <div>Completing authentication...</div>;
  }

  if (status === 'error') {
    return (
      <div>
        <div>Authentication Error</div>
        <button onClick={() => router.push('/login')}>Back to Login</button>
      </div>
    );
  }

  return <div>Authentication Successful! Redirecting...</div>;
}