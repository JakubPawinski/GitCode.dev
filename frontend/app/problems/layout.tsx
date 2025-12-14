import { PropsWithChildren } from 'react'
import { ProblemsLayoutProvider } from '@/contexts/ProblemsLayoutContext'
export default function ProblemsLayout({ children }: PropsWithChildren) {
  return <ProblemsLayoutProvider>{children}</ProblemsLayoutProvider>
}
