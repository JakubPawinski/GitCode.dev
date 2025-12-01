// GitCode.dev/frontend/app/example/user/layout.tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['user']}>
      {children}
    </ProtectedRoute>
  );
}