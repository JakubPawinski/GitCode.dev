// GitCode.dev/frontend/app/example/premium/layout.tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function PremiumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['premium_user']}>
      {children}
    </ProtectedRoute>
  );
}