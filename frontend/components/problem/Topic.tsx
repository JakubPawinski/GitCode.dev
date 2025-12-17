export const Topic = ({ topic }: { topic: string }) => {
  return (
    <div
      className={`bg-primary/10 text-foreground/80 hover:bg-primary/20 hover:text-foreground inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-all duration-300`}
    >
      {topic}
    </div>
  )
}
