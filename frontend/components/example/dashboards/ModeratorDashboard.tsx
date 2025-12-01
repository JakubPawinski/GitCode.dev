// GitCode.dev/frontend/components/dashboards/ModeratorDashboard.tsx
'use client';

import { useRouter } from 'next/navigation';
import { User } from '@/interfaces/user-interface';

export function ModeratorDashboard({ user }: { user: User }) {
  const router = useRouter();

  const moderatorButtons = [
    { path: '/example/user', label: 'User Page' },
    { path: '/example/all-users', label: 'All Users Page' },
    { path: '/example/moderator', label: 'Moderator Page' },
    { path: '/example/management', label: 'Management Page' },
  ];

  return (
    <div>
      <h2>Moderator Dashboard</h2>
      <p>Welcome, {user.firstName} {user.lastName}!</p>
      <p>Your role: {user.roles.join(', ')}</p>
      <h3>Accessible Pages:</h3>
      <div>
        {moderatorButtons.map(button => (
          <button key={button.path} onClick={() => router.push(button.path)}>
            {button.label}
          </button>
        ))}
      </div>
    </div>
  );
}