// GitCode.dev/frontend/app/example/management/layout.tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['admin', 'moderator']}>
      {children}
    </ProtectedRoute>
  );
}