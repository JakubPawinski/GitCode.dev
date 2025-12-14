export interface TopicProps {
  topic: string
  isClicked: boolean
}

export const Topic = ({ topic, isClicked }: TopicProps) => {
  return (
    <div
      className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
        isClicked
          ? 'from-primary to-accent text-background scale-105 bg-gradient-to-r shadow-lg'
          : 'bg-primary/20 text-primary hover:bg-primary/30 hover:scale-105'
      }`}
    >
      {topic}
    </div>
  )
}
