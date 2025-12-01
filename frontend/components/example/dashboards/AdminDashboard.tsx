// GitCode.dev/frontend/components/example/dashboards/AdminDashboard.tsx
'use client';

import { useRouter } from 'next/navigation';
import { User } from '@/interfaces/user-interface';

export function AdminDashboard({ user }: { user: User }) {
  const router = useRouter();

  const adminButtons = [
    { path: '/example/user', label: 'User Page' },
    { path: '/example/all-users', label: 'All Users Page' },
    { path: '/example/admin', label: 'Admin Page' },
    { path: '/example/management', label: 'Management Page' },
    { path: '/example/moderator', label: 'Moderator Page' },
    { path: '/example/premium', label: 'Premium Page' },
  ];

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <p>Welcome, {user.firstName} {user.lastName}!</p>
      <p>Your role: {user.roles.join(', ')}</p>
      <h3>Accessible Pages:</h3>
      <div>
        {adminButtons.map(button => (
          <button key={button.path} onClick={() => router.push(button.path)}>
            {button.label}
          </button>
        ))}
      </div>
    </div>
  );
}