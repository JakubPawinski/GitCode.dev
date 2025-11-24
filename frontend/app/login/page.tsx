// GitCode.dev/frontend/app/login/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setCheckedAuth(true);
    }
  }, [isLoading]);

  useEffect(() => {
    if (checkedAuth && isAuthenticated) {
      console.log('User is authenticated, redirecting to dashboard');
      router.push('/dashboard');
      router.refresh();
    }
  }, [isAuthenticated, checkedAuth, router]);

  if (isLoading || !checkedAuth) return <div>Loading...</div>;
  if (isAuthenticated) return <div>Redirecting to dashboard...</div>;

  return <LoginForm />;
}