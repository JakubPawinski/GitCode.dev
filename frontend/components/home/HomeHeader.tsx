'use client'

import { availableTopics } from '@/consts/problem/topics'
import Link from 'next/link'
import { useMemo, useState } from 'react'

const CHUNK_SIZE = 8

export const HomeHeader = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false)

  const visibleTopics = isExpanded
    ? availableTopics
    : availableTopics.slice(0, CHUNK_SIZE)

  const topicRows = useMemo(() => {
    const rows = []
    for (let i = 0; i < visibleTopics.length; i += CHUNK_SIZE) {
      rows.push(visibleTopics.slice(i, i + CHUNK_SIZE))
    }
    return rows
  }, [visibleTopics])

  return (
    <header className="flex flex-col py-4">
      <div className="flex flex-col items-center gap-2">
        {topicRows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex flex-wrap justify-center gap-2">
            {row.map((topic) => (
              <Link
                key={topic}
                href={'/tag/' + topic}
                className="from-primary/20 to-accent/10 hover:from-primary/30 hover:to-accent/20 text-foreground/80 hover:text-foreground border-primary/30 transform cursor-pointer rounded-full border bg-gradient-to-r px-3 py-1.5 text-xs font-semibold shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                {topic}
              </Link>
            ))}
          </div>
        ))}
      </div>
      {availableTopics.length > CHUNK_SIZE && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-accent hover:text-primary transform text-sm font-semibold transition-all duration-300 hover:scale-105"
          >
            {isExpanded ? 'Show Less ▲' : 'Show More ▼'}
          </button>
        </div>
      )}
    </header>
  )
}
