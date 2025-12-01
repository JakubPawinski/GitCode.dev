// GitCode.dev/frontend/app/example/moderator/layout.tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function ModeratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['moderator']}>
      {children}
    </ProtectedRoute>
  );
}