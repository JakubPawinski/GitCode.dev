'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export const Topic = ({ topic }: { topic: string }) => {
  const { problem } = useParams()

  const topicSlug = topic.replaceAll(' ', '-').toLowerCase()

  if (problem) {
    return (
      <div
        className={`bg-primary/10 text-foreground/80 hover:bg-primary/20 hover:text-foreground inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-all duration-300`}
      >
        {topic}
      </div>
    )
  }
  return (
    <div
      className={`bg-primary/10 text-foreground/80 hover:bg-primary/20 hover:text-foreground inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-all duration-300`}
    >
      {topic}
    </div>
  )
}
