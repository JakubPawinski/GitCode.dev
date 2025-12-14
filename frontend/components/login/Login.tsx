'use client';

import { useAuth } from '@/contexts/auth/AuthContext';
import { useSearchParams } from 'next/navigation';

export default function Login() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const handleLogin = () => {
    login();
  };

  return (
    <div>
      <h2>Sign in to your account</h2>
      <button onClick={handleLogin}>
        Continue with Keycloak
      </button>
      {redirect && redirect !== '/' && (
        <p>
          You will be redirected back to your previous page after login.
        </p>
      )}
    </div>
  );
}