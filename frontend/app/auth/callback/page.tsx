//GitCode.dev/frontend/app/auth/callback/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallbackPage() {
  const { refreshAuth, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('Auth callback started');
        const success = searchParams.get('success');
        
        if (success === 'true') {
          console.log('OAuth flow completed successfully, refreshing auth...');
          await refreshAuth();
          setStatus('success');
          console.log('Auth refresh completed');
        } else {
          const errorParam = searchParams.get('error');
          console.error('OAuth error:', errorParam);
          setError(errorParam || 'Authentication failed');
          setStatus('error');
        }
      } catch (error) {
        console.error('Callback error:', error);
        setError('Failed to complete authentication');
        setStatus('error');
      }
    };

    handleCallback();
  }, [refreshAuth, searchParams]);

  useEffect(() => {
    if (isAuthenticated && status === 'success') {
      console.log('User is authenticated, redirecting to dashboard...');
      router.push('/');
    }
  }, [isAuthenticated, status, router]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <div className="mb-4 text-lg">Completing authentication...</div>
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <div className="mb-4 text-lg text-red-600">Authentication Error</div>
          <div className="mb-6 text-gray-600">{error}</div>
          <button
            onClick={() => router.push('/login')}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-500"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="text-center">
        <div className="mb-4 text-lg text-green-600">Authentication Successful!</div>
        <div className="text-gray-600">Redirecting to your dashboard...</div>
      </div>
    </div>
  );
}