//GitCode.dev/frontend/app/page.tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Image from 'next/image';
import { useState } from 'react';

function DashboardContent() {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    // Nie ustawiaj setIsLoggingOut(false) bo komponent zostanie unmountowany po przekierowaniu
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Image
              className="dark:invert"
              src="/next.svg"
              alt="GitCode.dev"
              width={100}
              height={20}
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">Dashboard</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-medium text-gray-900 dark:text-white">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {user?.email}
              </div>
            </div>
            
            {user?.avatarUrl && (
              <Image
                src={user.avatarUrl}
                alt="Profile"
                width={40}
                height={40}
                className="rounded-full"
              />
            )}
            
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user?.firstName}!
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Ready to start coding and collaborating?
            </p>
          </div>

          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Your Projects
              </h3>
              <p className="mt-2 text-3xl font-bold text-blue-600">0</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Create your first project
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Repositories
              </h3>
              <p className="mt-2 text-3xl font-bold text-green-600">0</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Start coding today
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Collaborations
              </h3>
              <p className="mt-2 text-3xl font-bold text-purple-600">0</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Invite team members
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Quick Actions
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <button className="rounded-lg border border-gray-200 bg-white p-6 text-left hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700">
                <div className="text-lg font-medium text-gray-900 dark:text-white">
                  New Repository
                </div>
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Create a new code repository
                </div>
              </button>

              <button className="rounded-lg border border-gray-200 bg-white p-6 text-left hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700">
                <div className="text-lg font-medium text-gray-900 dark:text-white">
                  Join Project
                </div>
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Collaborate with others
                </div>
              </button>

              <button className="rounded-lg border border-gray-200 bg-white p-6 text-left hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700">
                <div className="text-lg font-medium text-gray-900 dark:text-white">
                  Profile Settings
                </div>
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Manage your account
                </div>
              </button>

              <button className="rounded-lg border border-gray-200 bg-white p-6 text-left hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700">
                <div className="text-lg font-medium text-gray-900 dark:text-white">
                  Documentation
                </div>
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Learn how to use GitCode
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}