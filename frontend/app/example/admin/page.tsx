// GitCode.dev/frontend/app/example/admin/page.tsx
'use client';
import TokenStore from '@/utils/token-store';
import { useAuth } from '@/contexts/AuthContext';
export default function AdminPage() {
  const { user } = useAuth();
  return (
    <div>
      <h1>Admin Panel</h1>
      <h6>{TokenStore.getToken()}</h6>
      <h1>{user?.id}</h1>
      <p>This page is only accessible to users with the admin role.</p>
      <p>You can manage all system settings here.</p>
    </div>
  );
}