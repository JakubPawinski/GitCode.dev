// GitCode.dev/frontend/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      router.push(isAuthenticated ? '/dashboard' : '/login');
    }
  }, [isAuthenticated, isLoading, router]);

  return <div>Redirecting...</div>;
}