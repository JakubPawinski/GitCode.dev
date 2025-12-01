// GitCode.dev/frontend/app/example/all-users/layout.tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function AllUsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}