// GitCode.dev/frontend/app/forbidden/page.tsx
'use client';

import { useRouter } from 'next/navigation';

export default function ForbiddenPage() {
  const router = useRouter();

  return (
    <div>
      <h1>403 - Access Forbidden</h1>
      <p>You do not have permission to view this page.</p>
      <button onClick={() => router.push('/dashboard')}>
        Go to Dashboard
      </button>
    </div>
  );
}