export interface TopicProps {
  topic: string
}

export const Topic = ({ topic }: TopicProps) => {
  return (
    <div
      className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300`}
    >
      {topic}
    </div>
  )
}
