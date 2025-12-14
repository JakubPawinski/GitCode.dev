import { PropsWithChildren } from 'react'
import { ProblemsLayoutProvider } from '@/contexts/ProblemsLayoutContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'

export default function ProblemsLayout({ children }: PropsWithChildren) {
  return <ProtectedRoute><ProblemsLayoutProvider>{children}</ProblemsLayoutProvider></ProtectedRoute>
}
