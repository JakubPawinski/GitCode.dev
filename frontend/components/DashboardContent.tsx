// GitCode.dev/frontend/components/DashboardContent.tsx
'use client'

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserDashboard } from '@/components/example/dashboards/UserDashboard';
import { AdminDashboard } from '@/components/example/dashboards/AdminDashboard';
import { ModeratorDashboard } from '@/components/example/dashboards/ModeratorDashboard';
import { PremiumDashboard } from '@/components/example/dashboards/PremiumDashboard';

export function DashboardContent() {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const renderDashboard = () => {
    if (!user) return null;

    if (user.roles.includes('admin')) {
      return <AdminDashboard user={user} />;
    } else if (user.roles.includes('moderator')) {
      return <ModeratorDashboard user={user} />;
    } else if (user.roles.includes('premium_user')) {
      return <PremiumDashboard user={user} />;
    } else if (user.roles.includes('user')) {
      return <UserDashboard user={user} />;
    } else {
      return (
        <div>
          <h2>Dashboard</h2>
          <p>Welcome, {user.firstName} {user.lastName}!</p>
          <p>You don't have any specific role assigned.</p>
        </div>
      );
    }
  };

  return (
    <div>
      {renderDashboard()}
      <div>
        <button onClick={handleLogout} disabled={isLoggingOut}>
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </div>
  );
}