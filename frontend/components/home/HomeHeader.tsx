import { availableTopics } from '@/consts/problem/topics'
import Link from 'next/link'

export const HomeHeader = () => {
  const topics = availableTopics
  return (
    <header>
      {topics.map((topic) => (
        <Link key={topic} href={'/tag/' + topic}>
          <div>{topic}</div>
        </Link>
      ))}
    </header>
  )
}
