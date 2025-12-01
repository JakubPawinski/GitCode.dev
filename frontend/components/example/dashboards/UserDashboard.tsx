// GitCode.dev/frontend/components/example/dashboards/UserDashboard.tsx
'use client';

import { useRouter } from 'next/navigation';
import { User } from '@/interfaces/user-interface';

export function UserDashboard({ user }: { user: User }) {
  const router = useRouter();

  const userButtons = [
    { path: '/example/user', label: 'User Page' },
    { path: '/example/all-users', label: 'All Users Page' },
  ];

  return (
    <div>
      <h2>User Dashboard</h2>
      <p>Welcome, {user.firstName} {user.lastName}!</p>
      <p>Your role: {user.roles.join(', ')}</p>
      <h3>Accessible Pages:</h3>
      <div>
        {userButtons.map(button => (
          <button key={button.path} onClick={() => router.push(button.path)}>
            {button.label}
          </button>
        ))}
      </div>
    </div>
  );
}