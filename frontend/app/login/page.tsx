// GitCode.dev/frontend/app/login/page.tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <LoginForm />;
}