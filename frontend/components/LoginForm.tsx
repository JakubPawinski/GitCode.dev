// GitCode.dev/frontend/components/LoginForm.tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'next/navigation';

export default function LoginForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const handleLogin = () => {
    login();
  };

  return (
    <div>
      <h2>Sign in to your account</h2>
      <button onClick={handleLogin}>
        Continue with Keycloak
      </button>
      {redirect && redirect !== '/dashboard' && (
        <p>
          You will be redirected back to your previous page after login.
        </p>
      )}
    </div>
  );
}