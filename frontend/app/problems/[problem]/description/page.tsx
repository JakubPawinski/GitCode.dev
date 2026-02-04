'use client'
import { Description } from '@/components/problem/Description'
import { useProblemContext } from '@/contexts/problem/ProblemContext'
import { useNotificationSSE } from '@/hooks/sse/use-notification-sse'

export default function DescriptionPage() {
  const problemData = useProblemContext()

  if (!problemData) return null
  const { messages } = useNotificationSSE()

  return <Description {...problemData} />
}
